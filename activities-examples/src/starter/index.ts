import { Connection, WorkflowClient } from '@temporalio/client';
import { example } from '../workflows';

async function run(): Promise<void> {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);

  const handle = client.createWorkflowHandle(example, { taskQueue: 'tutorial' });

  const result = await handle.execute();
  console.log(result); // 'The answer is 42'
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
