import { Connection, Client } from '@temporalio/client';

// @@@SNIPSTART typescript-describe-a-scheduled-workflow
async function run() {
  const client = new Client({
    connection: await Connection.connect(),
  });

  const handle = client.schedule.getHandle('sample-schedule');

  const result = await handle.describe();

  console.log(`Schedule description: ${JSON.stringify(result)}`);
}
// @@@SNIPEND

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
