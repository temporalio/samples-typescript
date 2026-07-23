import { TestWorkflowEnvironment } from '@temporalio/testing';
import { after, before, describe, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import { WorkflowStreamClient } from '@temporalio/workflow-streams/client';
import type {
  LanguageModelV4,
  LanguageModelV4CallOptions,
  LanguageModelV4GenerateResult,
  LanguageModelV4StreamPart,
  LanguageModelV4StreamResult,
  ProviderV4,
} from '@ai-sdk/provider';
import assert from 'assert';
import { streamingAgent, STREAM_TOPIC, consumerDoneSignal } from '../workflows';
import * as activities from '../activities';
import { AiSdkPlugin } from '@temporalio/ai-sdk';

// A deterministic, offline model that streams a fixed set of text deltas so
// these tests need no OPENAI_API_KEY and can assert on exact output.
class MockStreamModel implements LanguageModelV4 {
  readonly specificationVersion = 'v4';
  readonly provider = 'mock';
  readonly modelId = 'mock-model';
  private readonly chunks: string[];

  constructor(chunks: string[]) {
    this.chunks = chunks;
  }

  get supportedUrls(): Record<string, RegExp[]> {
    return {};
  }

  doGenerate(_options: LanguageModelV4CallOptions): Promise<LanguageModelV4GenerateResult> {
    throw new Error('generate not supported by mock');
  }

  doStream(_options: LanguageModelV4CallOptions): Promise<LanguageModelV4StreamResult> {
    const chunks = this.chunks;
    const parts: LanguageModelV4StreamPart[] = [
      { type: 'stream-start', warnings: [] },
      { type: 'text-start', id: 't1' },
      ...chunks.map((delta): LanguageModelV4StreamPart => ({ type: 'text-delta', id: 't1', delta })),
      { type: 'text-end', id: 't1' },
      {
        type: 'finish',
        finishReason: { unified: 'stop', raw: undefined },
        usage: {
          inputTokens: { total: 1, noCache: undefined, cacheRead: undefined, cacheWrite: undefined },
          outputTokens: { total: chunks.length, text: undefined, reasoning: undefined },
        },
      },
    ];
    return Promise.resolve({
      stream: new ReadableStream<LanguageModelV4StreamPart>({
        start(controller) {
          for (const part of parts) controller.enqueue(part);
          controller.close();
        },
      }),
      request: {},
      response: {},
    });
  }
}

function mockProvider(chunks: string[]): ProviderV4 {
  return {
    specificationVersion: 'v4',
    languageModel: () => new MockStreamModel(chunks),
    embeddingModel: () => {
      throw new Error('not implemented');
    },
    imageModel: () => {
      throw new Error('not implemented');
    },
  };
}

// Collect the live deltas an external subscriber sees on a topic.
async function collectDeltas(client: any, workflowId: string, topic: string): Promise<string[]> {
  const deltas: string[] = [];
  const streamClient = WorkflowStreamClient.create(client, workflowId);
  for await (const item of streamClient.subscribe<Uint8Array>(topic, 0, { resultType: true })) {
    const part = JSON.parse(new TextDecoder().decode(item.data));
    if (part.type === 'text-delta') deltas.push(part.delta);
    if (part.type === 'finish') break;
  }
  // Mirror the real consumer: acknowledge receipt so the workflow can complete.
  await client.workflow.getHandle(workflowId).signal(consumerDoneSignal);
  return deltas;
}

describe('streaming agents', function () {
  this.timeout(30_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('streamingAgent publishes live deltas and returns the full text', async () => {
    const { client, nativeConnection } = testEnv;
    const taskQueue = 'test-stream-text';
    const chunks = ['Dur', 'able ', 'streams ', 'of ', 'thought'];

    const worker = await Worker.create({
      connection: nativeConnection,
      plugins: [new AiSdkPlugin({ modelProvider: mockProvider(chunks) })],
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities,
    });

    await worker.runUntil(async () => {
      const handle = await client.workflow.start(streamingAgent, {
        args: ['Temporal'],
        workflowId: 'test-stream-text-' + Date.now(),
        taskQueue,
      });

      const deltasPromise = collectDeltas(client, handle.workflowId, STREAM_TOPIC);
      const result = await handle.result();
      const deltas = await deltasPromise;

      // The workflow durably reassembles the full text from the replayed stream.
      assert.strictEqual(result, chunks.join(''));
      // The external subscriber saw the response arrive incrementally.
      assert.ok(deltas.length > 1, `expected multiple live deltas, got ${deltas.length}`);
      assert.strictEqual(deltas.join(''), chunks.join(''));
    });
  });
});
