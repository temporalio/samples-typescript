import { Connection, WorkflowClient } from '@temporalio/client';
import { progress } from '../workflows';

async function run() {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);

  const workflow = client.createWorkflowHandle(progress, { taskQueue: 'tutorial' });

  await workflow.start();

  const val = await workflow.query.getProgress();
  // Should print "10", may print another number depending on timing
  console.log(val);

  const result = await workflow.result();
  console.log(result); // 100
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
