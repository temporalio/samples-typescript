import { TestWorkflowEnvironment } from '@temporalio/testing';
import { Worker } from '@temporalio/worker';
import { GoogleAdkPlugin } from '@temporalio/google-adk-agents';
import { after, before, describe, it } from 'mocha';
import assert from 'assert';
import { humanApproval, approveSignal, approveUpdate } from '../workflows';

describe('google-adk-agents/human-approval workflow scenarios', function () {
  this.timeout(30_000);

  let testEnv: TestWorkflowEnvironment;

  before(async () => {
    testEnv = await TestWorkflowEnvironment.createLocal();
  });

  after(async () => {
    await testEnv?.teardown();
  });

  async function makeWorker(taskQueue: string) {
    return Worker.create({
      connection: testEnv.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      plugins: [new GoogleAdkPlugin()],
    });
  }

  it('humanApproval: long-running tool resumes on the approve Signal', async () => {
    const taskQueue = 'test-google-adk-human-approval-signal';
    const worker = await makeWorker(taskQueue);
    await worker.runUntil(async () => {
      const handle = await testEnv.client.workflow.start(humanApproval, {
        workflowId: 'test-google-adk-hitl-signal-' + Date.now(),
        taskQueue,
      });
      await handle.signal(approveSignal, 'approved-via-signal');
      assert.strictEqual(await handle.result(), 'approved-via-signal');
    });
  });

  it('humanApproval: long-running tool resumes on the approve Update', async () => {
    const taskQueue = 'test-google-adk-human-approval-update';
    const worker = await makeWorker(taskQueue);
    await worker.runUntil(async () => {
      const handle = await testEnv.client.workflow.start(humanApproval, {
        workflowId: 'test-google-adk-hitl-update-' + Date.now(),
        taskQueue,
      });
      const updateResult = await handle.executeUpdate(approveUpdate, { args: ['approved-via-update'] });
      assert.strictEqual(updateResult, 'approved-via-update');
      assert.strictEqual(await handle.result(), 'approved-via-update');
    });
  });
});
