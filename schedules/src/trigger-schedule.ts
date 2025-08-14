import { Connection, Client } from '@temporalio/client';

// @@@SNIPSTART typescript-trigger-a-scheduled-workflow
async function run() {
  const client = new Client({
    connection: await Connection.connect(),
  });

  const handle = client.schedule.getHandle('sample-schedule');

  await handle.trigger();

  console.log(`Schedule is now triggered.`);
}
// @@@SNIPEND

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
