import { TestWorkflowEnvironment } from '@temporalio/testing';
import { after, before, describe, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import { Client } from '@temporalio/client';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import { WorkflowStreamClient } from '@temporalio/workflow-streams/client';
import { type StreamEvent } from '@openai/agents-core';
import assert from 'assert';
import { StreamingFakeModelProvider, streamingTextEvents } from './fake-model';
import { consumerDoneSignal, streamingChat, streamingTopic } from '../workflows';

describe('openai-agents/streaming workflow scenarios', function () {
  this.timeout(30_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('streamingChat: external subscriber receives the streamed events while the run is in flight', async () => {
    const taskQueue = 'test-streaming';
    const events = streamingTextEvents('Hello streamed world');

    let releaseFinalEvent!: () => void;
    const finalEventGate = new Promise<void>((resolve) => {
      releaseFinalEvent = resolve;
    });

    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [
        new OpenAIAgentsPlugin({
          modelProvider: new StreamingFakeModelProvider(events, finalEventGate),
        }),
      ],
      bundlerOptions: {
        webpackConfigHook: (config) => ({
          ...config,
          resolve: {
            ...config.resolve,
            conditionNames: ['require', 'browser', 'default'],
          },
        }),
      },
    });

    // The client carries streamingTopic to the Workflow via the config header.
    const client = new Client({
      connection: testEnv.connection,
      plugins: [
        new OpenAIAgentsPlugin({
          modelProvider: new StreamingFakeModelProvider(events),
          modelParams: { streamingTopic, streamingBatchInterval: '50 milliseconds' },
        }),
      ],
    });

    const workflowId = 'test-streaming-' + Date.now();
    const result = await worker.runUntil(async () => {
      const handle = await client.workflow.start(streamingChat, {
        taskQueue,
        workflowId,
        args: ['Hi'],
      });

      const received: StreamEvent[] = [];
      const streamClient = WorkflowStreamClient.create(client, workflowId);
      const gen = streamClient.topic<StreamEvent>(streamingTopic).subscribe(0, { pollCooldown: 0 });
      const collect = (async () => {
        for await (const item of gen) {
          received.push(item.data);
          releaseFinalEvent();
          if (received.length >= events.length) {
            await gen.return();
            break;
          }
        }
        await handle.signal(consumerDoneSignal);
      })();

      const finalOutput = await handle.result();
      await collect;

      assert.strictEqual(received.length, events.length);
      assert.deepStrictEqual(
        received.map((e) => e.type),
        events.map((e) => e.type),
      );
      const streamedText = received.map((e) => (e.type === 'output_text_delta' ? e.delta : '')).join('');
      assert.strictEqual(streamedText, 'Hello streamed world');
      return finalOutput;
    });

    assert.strictEqual(result, 'Hello streamed world');
  });
});
