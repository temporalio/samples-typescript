import { Connection, Client } from '@temporalio/client';

async function run() {
  const client = new Client({
    connection: await Connection.connect(),
  });

  const handle = client.schedule.getHandle('sample-schedule');
  await handle.unpause();

  console.log(`Schedule is now unpaused.`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
