import { TestWorkflowEnvironment } from '@temporalio/testing';
import { after, before, it } from 'mocha';
import { Worker } from '@temporalio/worker';
import { YOUR_WORKFLOW } from '../workflows';
import assert from 'assert';

describe('Example workflow with mocks', () => {
  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  it('successfully completes the Workflow with a mocked Activity', async () => {
    const { client, nativeConnection } = testEnv;
    const taskQueue = 'test';

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities: {
        YOUR_ACTIVITY: async () => 'Hello, Temporal!',
      },
    });

    const result = await worker.runUntil(
      client.workflow.execute(example, {
        args: [''],
        workflowId: 'test',
        taskQueue,
      })
    );
    assert.equal(result, 'Hello, Temporal!');
  });
});
