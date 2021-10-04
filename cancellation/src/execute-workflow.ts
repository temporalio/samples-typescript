import { Connection, WorkflowClient } from '@temporalio/client';
import { example } from './workflows';

async function run() {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);

  const handle = client.createWorkflowHandle(example, { taskQueue: 'tutorial' });

  await handle.start();

  await new Promise((resolve) => setTimeout(resolve, 100));
  await handle.cancel();
  console.log('Cancelled workflow successfully');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
