import { Connection, WorkflowClient } from '@temporalio/client';
import { example } from '../workflows';

async function run() {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);

  const workflow = client.createWorkflowHandle(example, { taskQueue: 'tutorial20210915' });

  await workflow.start();

  await new Promise(resolve => setTimeout(resolve, 100));
  await workflow.cancel();
  console.log('Cancelled workflow successfully');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
