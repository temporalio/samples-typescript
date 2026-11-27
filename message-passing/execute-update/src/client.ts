// @@@SNIPSTART typescript-update-client
import { Connection, Client } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { counter, fetchAndAdd, done } from './workflows';
import { nanoid } from 'nanoid';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  const handle = await client.workflow.start(counter, {
    taskQueue: 'my-task-queue',
    args: [],
    workflowId: 'workflow-' + nanoid(),
  });
  console.log(`Started workflow ${handle.workflowId}`);

  // Send the 'fetchAndAdd' update with the value `1` as input.
  const { previousCount } = await handle.executeUpdate(fetchAndAdd, { args: [{ amount: 1 }] });
  console.log(`incrementing counter; previous value was ${previousCount}`);

  // Send the 'fetchAndAdd' update with invalid input.
  const invalidArg = -1;
  try {
    await handle.executeUpdate(fetchAndAdd, { args: [{ amount: invalidArg }] });
  } catch (error) {
    console.log(`Update argument ${invalidArg} was rejected: ${error}`);
  }

  // Send the 'done' update to allow the workflow to complete.
  await handle.executeUpdate(done);

  const { count } = await handle.result();
  console.log(`Final counter value is ${count}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND
