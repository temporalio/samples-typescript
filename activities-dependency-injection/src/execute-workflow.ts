import { Connection, WorkflowClient } from '@temporalio/client';
import { dependencyWF } from './workflows';

async function run(): Promise<void> {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);

  const result = await client.execute(dependencyWF, { taskQueue: 'tutorial' });
  console.log(result);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
