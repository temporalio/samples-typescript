import { Connection, Client } from '@temporalio/client';

// @@@SNIPSTART typescript-pause-a-scheduled-workflow
async function run() {
  const client = new Client({
    connection: await Connection.connect(),
  });

  const handle = client.schedule.getHandle('sample-schedule');
  await handle.pause();

  console.log(`Schedule is now paused.`);
}
// @@@SNIPEND

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
