import { TestWorkflowEnvironment } from '@temporalio/testing';
import { after, before, describe, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import { Client } from '@temporalio/client';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import { WorkflowStreamClient } from '@temporalio/workflow-streams/client';
import assert from 'assert';
import { StreamingFakeModelProvider, streamingTextEvents } from './fake-model';
import { streamingChat, streamingTopic } from '../workflows';

interface ModelStreamEvent {
  type?: string;
  delta?: string;
}

describe('openai-agents/streaming workflow scenarios', function () {
  this.timeout(30_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('streamingChat: external subscriber receives the streamed events in order', async () => {
    const taskQueue = 'test-streaming';
    const events = streamingTextEvents('Hello streamed world');

    const worker = await Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [
        new OpenAIAgentsPlugin({
          modelProvider: new StreamingFakeModelProvider(events),
          modelParams: { streamingTopic, streamingBatchInterval: '50 milliseconds' },
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
          modelParams: { streamingTopic },
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

      const received: ModelStreamEvent[] = [];
      const streamClient = WorkflowStreamClient.create(client, workflowId);
      const gen = streamClient.topic<ModelStreamEvent>(streamingTopic).subscribe(0, { pollCooldown: 0 });
      const collect = (async () => {
        for await (const item of gen) {
          received.push(item.data);
          if (received.length >= events.length) {
            await gen.return();
            break;
          }
        }
      })();

      const finalOutput = await handle.result();
      await collect;

      assert.strictEqual(received.length, events.length);
      assert.deepStrictEqual(
        received.map((e) => e.type),
        events.map((e) => e.type),
      );
      assert.strictEqual(received[0]!.delta, 'Hello streamed world');
      return finalOutput;
    });

    assert.strictEqual(result, 'Hello streamed world');
  });
});
