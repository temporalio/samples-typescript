import assert from 'assert';
import { after, before, describe, it } from 'mocha';
import { StrandsPlugin } from '@temporalio/strands-agents';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { persistToolCall } from '../activities/hooks';
import { hooksWorkflow } from '../workflows';
import { StubModel, textTurn, toolCallTurn } from './stub-model';

describe('hooksWorkflow', () => {
  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('fires both the in-workflow callback and the activity-as-hook on AfterToolCallEvent', async () => {
    const { client, nativeConnection } = testEnv;
    const taskQueue = 'test';

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities: { persistToolCall },
      plugins: [
        new StrandsPlugin({
          models: {
            bedrock: () =>
              new StubModel([toolCallTurn('echo', 'call_1', { text: 'hello' }), textTurn('done')]),
          },
        }),
      ],
    });

    const fired = await worker.runUntil(
      client.workflow.execute(hooksWorkflow, {
        args: ['say hello'],
        workflowId: 'test-hooks',
        taskQueue,
      })
    );
    assert.deepEqual(fired, ['echo']);
  });
});
