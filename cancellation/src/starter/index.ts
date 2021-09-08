import { Connection, WorkflowClient } from '@temporalio/client';
import { Example } from '../interfaces/workflows';

async function run() {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);

  const example = client.stub<Example>('example', { taskQueue: 'tutorial' });

  await example.start();

  await new Promise(resolve => setTimeout(resolve, 100));
  await example.cancel();
  console.log('Cancelled workflow successfully');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
