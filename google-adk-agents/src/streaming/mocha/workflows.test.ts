import { BaseLlm } from '@google/adk';
import type { BaseLlmConnection, LlmResponse } from '@google/adk';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { GoogleAdkPlugin } from '@temporalio/google-adk-agents';
import { WorkflowStreamClient } from '@temporalio/workflow-streams/client';
import { after, before, describe, it } from 'mocha';
import assert from 'assert';
import { consumerDoneSignal, streamingModelCall, streamingTopic } from '../workflows';

const turn: LlmResponse[] = [
  { content: { role: 'model', parts: [{ text: 'Hello ' }] }, partial: true },
  { content: { role: 'model', parts: [{ text: 'streaming ' }] }, partial: true },
  { content: { role: 'model', parts: [{ text: 'world' }] }, partial: true },
  { content: { role: 'model', parts: [{ text: 'Hello streaming world' }] }, partial: false, turnComplete: true },
];

function gatedModelProvider(taken: () => number): (model: string) => BaseLlm {
  class GatedLlm extends BaseLlm {
    override async *generateContentAsync(): AsyncGenerator<LlmResponse, void> {
      for (const [index, response] of turn.entries()) {
        while (taken() < index) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        yield response;
      }
    }

    override async connect(): Promise<BaseLlmConnection> {
      throw new Error('GatedLlm does not support connect().');
    }
  }
  return (model: string) => new GatedLlm({ model });
}

describe('google-adk-agents/streaming workflow scenarios', function () {
  this.timeout(30_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('streamingModelCall: an external subscriber receives the chunks while the call is in flight', async () => {
    const taskQueue = 'test-google-adk-streaming';
    const received: LlmResponse[] = [];
    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [new GoogleAdkPlugin({ modelProvider: gatedModelProvider(() => received.length) })],
    });

    const workflowId = 'test-google-adk-streaming-' + Date.now();
    const result = await worker.runUntil(async () => {
      const handle = await testEnv.client.workflow.start(streamingModelCall, {
        args: ['stream please'],
        workflowId,
        taskQueue,
      });

      const streamClient = WorkflowStreamClient.create(testEnv.client, workflowId);
      const gen = streamClient.topic<LlmResponse>(streamingTopic).subscribe(0, { pollCooldown: 0 });
      for await (const item of gen) {
        received.push(item.data);
        if (received.length >= turn.length) {
          await gen.return();
          break;
        }
      }
      await handle.signal(consumerDoneSignal);

      assert.deepStrictEqual(
        received.map((response) => response.content?.parts?.[0]?.text),
        ['Hello ', 'streaming ', 'world', 'Hello streaming world'],
      );
      return handle.result();
    });

    assert.strictEqual(result.text, 'Hello streaming world');
    assert.strictEqual(result.chunks, 3);
  });
});
