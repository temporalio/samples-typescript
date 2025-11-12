import { Connection, Client, WithStartWorkflowOperation } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { transactionWorkflow } from './workflows';
import { getTransactionConfirmation } from './shared';

async function runTransactionWorkflow(transactionID: string, client: Client) {
  const workflowId = 'transaction-' + transactionID;

  const startWorkflowOperation = new WithStartWorkflowOperation(transactionWorkflow, {
    workflowId,
    taskQueue: 'early-return',
    workflowIdConflictPolicy: 'FAIL',
  });

  const earlyConfirmation = await client.workflow.executeUpdateWithStart(getTransactionConfirmation, {
    startWorkflowOperation,
  });
  console.log(`early transaction confirmation: ${JSON.stringify(earlyConfirmation)}`);
  const wfHandle = await startWorkflowOperation.workflowHandle();
  const finalReport = await wfHandle.result();
  console.log(`final transaction report: ${JSON.stringify(finalReport)}`);
}

async function main() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });
  const transactionID = process.argv[2] || 'my-transaction-id';
  await runTransactionWorkflow(transactionID, client);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
