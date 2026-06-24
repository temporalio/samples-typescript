import assert from 'assert';
import { after, before, describe, it } from 'mocha';
import { StrandsPlugin } from '@temporalio/strands-agents';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { WorkflowStreamClient } from '@temporalio/workflow-streams/client';
import { streamingWorkflow } from '../workflows';
import { StubModel, textTurn } from './stub-model';

describe('streamingWorkflow', () => {
  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('publishes model events to the WorkflowStream subscriber', async () => {
    const { client, nativeConnection } = testEnv;
    const taskQueue = 'test';

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [new StrandsPlugin({ models: { bedrock: () => new StubModel([textTurn('streamed')]) } })],
    });

    await worker.runUntil(async () => {
      const handle = await client.workflow.start(streamingWorkflow, {
        args: ['say something'],
        workflowId: 'test-streaming',
        taskQueue,
      });

      const stream = WorkflowStreamClient.create(client, handle.workflowId);
      const events: Array<{ type?: string }> = [];
      const subscriber = (async () => {
        for await (const item of stream.subscribe<{ type?: string }>(['events'], 0, {
          pollCooldown: '50 milliseconds',
          resultType: true,
        })) {
          events.push(item.data);
          if (item.data.type === 'modelMessageStopEvent') break;
        }
      })();

      assert.equal(await handle.result(), 'streamed');
      await subscriber;
      assert.ok(events.some((e) => e.type === 'modelMessageStartEvent'));
      assert.ok(events.some((e) => e.type === 'modelMessageStopEvent'));
    });
  });
});
