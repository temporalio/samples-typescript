import { Connection, WorkflowClient } from '@temporalio/client';
import { myWorkflow, workflowId } from './workflows';

async function run(): Promise<void> {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);
  await client.start(myWorkflow, { taskQueue: 'tutorial', workflowId });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
