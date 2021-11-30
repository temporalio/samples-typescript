import { WorkflowClient } from '@temporalio/client';
import { progress, getProgress } from './workflows';

async function run() {
  const client = new WorkflowClient();

  const handle = await client.start(progress, { taskQueue: 'timer-progress', workflowId: 'progress-0' });

  await new Promise((resolve) => setTimeout(resolve, 2000));
  const val = await handle.query(getProgress);
  // Should print "10", may print another number depending on timing
  console.log(val);

  await handle.result();
  console.log('complete');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
