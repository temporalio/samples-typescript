import { Connection, WorkflowClient } from '@temporalio/client';
import { countdownWorkflow, setDeadlineSignal, timeLeftQuery } from '../workflows';

async function run(): Promise<void> {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);

  const handle = await client.start(countdownWorkflow, { taskQueue: 'tutorial20210928' });
  console.log('Time left: ', await handle.query(timeLeftQuery));
  await handle.signal(setDeadlineSignal, Date.now() + 3000);
  console.log('Time left: ', await handle.query(timeLeftQuery));
  console.log('Done');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
