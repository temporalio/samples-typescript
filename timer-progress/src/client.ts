import { Client, Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { progress, getProgress } from './workflows';
import { setTimeout } from 'timers/promises';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

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
