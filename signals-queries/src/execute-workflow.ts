import { Connection, WorkflowClient } from '@temporalio/client';
import { unblockOrCancel, unblockSignal, isBlockedQuery } from './workflows';

async function run(): Promise<void> {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);
  const handle = client.createWorkflowHandle(unblockOrCancel, { taskQueue: 'tutorial' });
  await handle.start();
  console.log('blocked?', await handle.query(isBlockedQuery)); // true
  // To cancel instead of completing the Workflow, replace signal with: await handle.cancel()
  await handle.signal(unblockSignal);
  await handle.result();
  console.log('blocked?', await handle.query(isBlockedQuery)); // false
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
