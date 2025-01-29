// @@@SNIPSTART typescript-hello-client
import { Connection, Client } from '@temporalio/client';
import { sleepForDays } from './workflows';
import { nanoid } from 'nanoid';

async function run() {
  const connection = await Connection.connect({ address: 'localhost:7233' });
  const client = new Client({ connection });

  const handle = await client.workflow.start(sleepForDays, {
    taskQueue: 'sleep-for-days',
    workflowId: 'workflow-' + nanoid(),
  });
  console.log(`Started workflow ${handle.workflowId}`);

  // Wait for workflow completion (runs indefinitely until it receives a signal)
  console.log(await handle.result());
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND
