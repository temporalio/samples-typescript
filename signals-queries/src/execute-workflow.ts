import { Connection, WorkflowClient } from '@temporalio/client';
import { unblockOrCancel, unblockSignal, isBlockedQuery } from './workflows';

async function run(): Promise<void> {
  // Connect to localhost with default ConnectionOptions,
  // pass options to the Connection constructor to configure TLS and other settings.
  const connection = new Connection();
  // Workflows will be started in the "default" namespace unless specified otherwise
  // via options passed the WorkflowClient constructor.
  const client = new WorkflowClient(connection.service);
  // Create a typed handle for the example Workflow.
  const handle = client.createWorkflowHandle(unblockOrCancel, { taskQueue: 'tutorial' });
  await handle.start();
  console.log(await handle.query(isBlockedQuery)); // true
  await handle.signal(unblockSignal);
  await handle.result();
  console.log(await handle.query(isBlockedQuery)); // false
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
