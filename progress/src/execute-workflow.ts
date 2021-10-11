import { Connection, WorkflowClient } from '@temporalio/client';
import { Progress, getProgress } from './workflows';

async function run() {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);

  const handle = client.createWorkflowHandle(Progress, { taskQueue: 'tutorial' });

  await handle.start();

  const val = await handle.query(getProgress);
  // Should print "10", may print another number depending on timing
  console.log(val);

  const result = await handle.result();
  console.log(result); // 100
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
