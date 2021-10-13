import { Connection, WorkflowClient } from '@temporalio/client';
import { dependencyWF } from './workflows';

async function run(): Promise<void> {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);

  const handle = client.createWorkflowHandle(dependencyWF, { taskQueue: 'tutorial' });

  const result = await handle.execute();
  console.log(result);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
