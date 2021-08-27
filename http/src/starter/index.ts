import { Connection, WorkflowClient } from '@temporalio/client';
import { Example } from '../interfaces/workflows';

async function run() {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);

  const example = client.stub<Example>('example', { taskQueue: 'tutorial20210827' });

  const result = await example.execute();
  console.log(result); // 'The answer is 42'
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
