import { TestWorkflowEnvironment } from '@temporalio/testing';
import { before, describe, it } from 'mocha';
import * as wo from '@temporalio/worker';
import { transactionWorkflow } from '../workflows';
import { getTransactionConfirmation } from '../shared';
import assert from 'assert';
import { WithStartWorkflowOperation } from '@temporalio/client';
const taskQueue = 'early-return';

describe('transaction workflow', function () {
  this.timeout(10000);
  let worker: wo.Worker;
  let env: TestWorkflowEnvironment;
  let workflowBundle: wo.WorkflowBundleWithSourceMap;

  before(async function () {
    wo.Runtime.install({ logger: new wo.DefaultLogger('WARN') });
    env = await TestWorkflowEnvironment.createLocal();

    workflowBundle = await wo.bundleWorkflowCode({
      workflowsPath: require.resolve('../workflows'),
      logger: new wo.DefaultLogger('WARN'),
    });
  });

  beforeEach(async function () {
    worker = await wo.Worker.create({
      connection: env.nativeConnection,
      workflowBundle,
      taskQueue,
    });
  });

  after(async function () {
    await env.teardown();
  });

  it('supports early return', async function () {
    await worker.runUntil(async () => {
      const startOp = new WithStartWorkflowOperation(transactionWorkflow, {
        workflowId: `transaction-early-return-test`,
        taskQueue,
        workflowIdConflictPolicy: 'FAIL',
      });
      const transactionConfirmation = await env.client.workflow.executeUpdateWithStart(
        getTransactionConfirmation, {
        startWorkflowOperation: startOp,
      });
      assert.equal(transactionConfirmation.status, 'confirmed');

      // We've obtained the transaction confirmation, and  the transaction workflow is
      // running in the background. We can wait for it to complete and obtain the final
      // transaction report.
      const wfHandle = await startOp.workflowHandle();
      const finalTransactionReport = await wfHandle.result();
      assert.equal(finalTransactionReport.status, 'complete');
      assert.equal(finalTransactionReport.finalAmount, 77);
    });
  });

});
