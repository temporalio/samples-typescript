import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import * as activities from '../activities';
import { greetingWorkflow } from '../workflows';
import { nanoid } from 'nanoid';
import assert from 'assert';

describe('infrequent polling workflow', function () {
  let testEnv: TestWorkflowEnvironment;
  const taskQueue = 'infrequent-activity-polling-task-queue';

  beforeAll(async () => {
    testEnv = await TestWorkflowEnvironment.createTimeSkipping();
  });

  afterAll(async () => {
    await testEnv?.teardown();
  });

  it('runs returns expected greeting', async () => {
    const { client, nativeConnection } = testEnv;

    const worker = await Worker.create({
      connection: nativeConnection,
      workflowsPath: require.resolve('../workflows'),
      activities,
      taskQueue,
    });

    const handle = await client.workflow.start(greetingWorkflow, {
      args: ['Temporal'],
      workflowId: nanoid(),
      taskQueue,
    });

    await worker.runUntil(async () => {
      await testEnv.sleep('241s');
      const result = await handle.result();
      assert.equal(result, 'Hello, Temporal!');
    });
  });
});
