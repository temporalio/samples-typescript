import { Connection, WorkflowClient } from '@temporalio/client';
import { example } from './workflows';

async function run(): Promise<void> {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);

  const handle = client.createWorkflowHandle(example, { taskQueue: 'tutorial' });

  const result = await handle.execute('Temporal');
  console.log(result); // 'Hola, Temporal'
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
