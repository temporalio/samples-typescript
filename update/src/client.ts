// @@@SNIPSTART typescript-update-client
import { Connection, Client } from '@temporalio/client';
import { counter, fetchAndAdd, done } from './workflows';
import { nanoid } from 'nanoid';

async function run() {
  const connection = await Connection.connect({ address: 'localhost:7233' });
  const client = new Client({ connection });

  const handle = await client.workflow.start(counter, {
    taskQueue: 'my-task-queue',
    args: [],
    workflowId: 'workflow-' + nanoid(),
  });
  console.log(`Started workflow ${handle.workflowId}`);

  const prevValue = await handle.executeUpdate(fetchAndAdd, { args: [1] });
  console.log(`incrementing counter; previous value was ${prevValue}`);

  const invalidArg = -1;
  try {
    await handle.executeUpdate(fetchAndAdd, { args: [invalidArg] });
  } catch (error) {
    console.log(`Update argument ${invalidArg} was rejected: ${error}`);
  }

  // Send the signal to allow the workflow to complete.
  await handle.signal(done);

  console.log(`Final counter value is ${await handle.result()}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND
