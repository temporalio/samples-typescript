import { Connection, WorkflowClient } from '@temporalio/client';
import { httpWorkflow } from './workflows';

async function run(): Promise<void> {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);

  const result = await client.execute(httpWorkflow, { taskQueue: 'tutorial' });
  console.log(result); // 'The answer is 42'
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
