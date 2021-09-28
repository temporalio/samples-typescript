import { Connection, WorkflowClient } from '@temporalio/client';
import { processOrderWorkflow } from '../workflows';

async function run(): Promise<void> {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);

  const handle = client.createWorkflowHandle(processOrderWorkflow, { taskQueue: 'tutorial20210928' });
  await handle.execute({ orderProcessingMS: 100, sendDelayedEmailTimeoutMS: 1000 });
  console.log('Done'); // Does **not** send email to `process.env.ADMIN_EMAIL` that order processing is slow
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
