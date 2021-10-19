import { Connection, WorkflowClient } from '@temporalio/client';
import { countdownWorkflow, addTimeSignal, timeLeftQuery } from '../workflows';

async function run(): Promise<void> {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);

  const handle = client.createWorkflowHandle(countdownWorkflow, { taskQueue: 'tutorial20210928' });
  await handle.start();
  // console.log('Time left: ', await handle.query(timeLeftQuery)); // buggy for now until Temporal Server v1.12.4 released
  await handle.signal(addTimeSignal, Date.now() + 1000);
  // console.log('Time left: ', await handle.query(timeLeftQuery));
  console.log('Done');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
