import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Runtime, Worker } from '@temporalio/worker';
import { eagerWorkflow } from '../workflows';
import * as activities from '../activities';
import { Client } from '@temporalio/client';

describe('Eager workflow', () => {
  let testEnv: TestWorkflowEnvironment;

  beforeAll(async () => {
    Runtime.install({});
    testEnv = await TestWorkflowEnvironment.createTimeSkipping();
  });

  afterAll(async () => {
    await testEnv?.teardown();
  });

  it('successfully completes the Workflow', async () => {
    const { nativeConnection } = testEnv;
    const client = new Client({
      connection: nativeConnection,
    });
    const taskQueue = 'test';

    const worker = await Worker.create({
      connection: nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities,
    });

    const result = await worker.runUntil(async () => {
      const handle = await client.workflow.start(eagerWorkflow, {
        args: ['Temporal'],
        workflowId: 'test',
        taskQueue,
        requestEagerStart: true,
      });
      expect(handle.eagerlyStarted).toBe(true);
      return await handle.result();
    });
    expect(result).toBe('Hello, Temporal!');
  });
});
