import { Connection, WorkflowClient } from '@temporalio/client';
import { processOrderWorkflow } from '../workflows';

async function run(): Promise<void> {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);

  const handle = client.createWorkflowHandle(processOrderWorkflow, { taskQueue: 'tutorial' });
  await handle.execute(1000, 100);
  console.log('Done'); // Sends email to `process.env.ADMIN_EMAIL` that order processing is slow
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
