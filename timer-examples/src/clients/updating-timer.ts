import { Client, Connection } from '@temporalio/client';
import { countdownWorkflow, setDeadlineSignal, timeLeftQuery } from '../workflows';
import { loadClientConnectConfig } from '@temporalio/envconfig';

async function run(): Promise<void> {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  const handle = await client.workflow.start(countdownWorkflow, {
    taskQueue: 'timer-examples',
    workflowId: 'countdown-0',
  });
  console.log('Time left: ', await handle.query(timeLeftQuery));
  await handle.signal(setDeadlineSignal, Date.now() + 3000);
  console.log('Time left: ', await handle.query(timeLeftQuery));
  await handle.result();
  console.log('Done');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
