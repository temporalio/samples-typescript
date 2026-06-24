import assert from 'assert';
import { after, before, describe, it } from 'mocha';
import { StrandsPlugin } from '@temporalio/strands-agents';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { deleteThing } from '../activities/activity-interrupt';
import { activityInterrupt, activityInterruptApproveSignal } from '../workflows';
import { StubModel, textTurn, toolCallTurn } from './stub-model';

describe('activityInterrupt workflow', () => {
  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('round-trips an interrupt thrown from an activity through the failure converter', async () => {
    const { client, nativeConnection } = testEnv;
    const taskQueue = 'test';

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities: { deleteThing },
      plugins: [
        new StrandsPlugin({
          models: {
            bedrock: () =>
              new StubModel([
                toolCallTurn('deleteThing', 'call_1', { name: 'system' }),
                textTurn('deleted system'),
              ]),
          },
        }),
      ],
    });

    const result = await worker.runUntil(async () => {
      const handle = await client.workflow.start(activityInterrupt, {
        args: ['delete system'],
        workflowId: 'test-activity-interrupt',
        taskQueue,
      });
      await handle.signal(activityInterruptApproveSignal, 'approve');
      return handle.result();
    });
    assert.equal(result, 'deleted system');
  });
});
