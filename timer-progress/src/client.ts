import { Client } from '@temporalio/client';
import { progress, getProgress } from './workflows';
import { setTimeout } from 'timers/promises';

async function run() {
  const client = new Client();

  const handle = await client.workflow.start(progress, { taskQueue: 'timer-progress', workflowId: 'progress-0' });

  await setTimeout(2000);
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
