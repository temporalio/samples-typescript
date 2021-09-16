import { Connection, WorkflowClient } from '@temporalio/client';
import { example } from './workflows';

async function run() {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);

  const workflow = client.createWorkflowHandle(example, { taskQueue: 'tutorial20210915' });

  const result = await workflow.execute();
  console.log(result); // 'The answer is 42'
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
