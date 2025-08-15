import { Connection, Client } from '@temporalio/client';

// @@@SNIPSTART typescript-list-a-scheduled-workflow
async function run() {
  const client = new Client({
    connection: await Connection.connect(),
  });

  const schedules = [];

  const scheduleList = client.schedule.list();

  for await (const schedule of scheduleList) {
    schedules.push(schedule);
  }

  console.log(`Schedules are now listed: ${JSON.stringify(schedules)}`);
}
// @@@SNIPEND

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
