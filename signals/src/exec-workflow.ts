import { Connection, WorkflowClient } from '@temporalio/client';
import { unblockOrCancel } from './workflows';

async function run() {
  // Connect to localhost with default ConnectionOptions,
  // pass options to the Connection constructor to configure TLS and other settings.
  const connection = new Connection();
  // Workflows will be started in the "default" namespace unless specified otherwise
  // via options passed the WorkflowClient constructor.
  const client = new WorkflowClient(connection.service);
  // Create a typed handle for the example Workflow.
  const workflow = client.createWorkflowHandle(unblockOrCancel, { taskQueue: 'tutorial' });
  await workflow.start();
  console.log(await workflow.query.isBlocked()); // true
  await workflow.signal.unblock();
  await workflow.result();
  console.log(await workflow.query.isBlocked()); // false
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
