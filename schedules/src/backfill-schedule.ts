import { Connection, Client, Backfill, ScheduleOverlapPolicy } from '@temporalio/client';

// @@@SNIPSTART typescript-backfill-a-scheduled-workflow
function subtractMinutes(minutes: number): Date {
  const now = new Date();
  return new Date(now.getTime() - minutes * 60 * 1000);
}

async function run() {
  const client = new Client({
    connection: await Connection.connect(),
  });

  const backfillOptions: Backfill = {
    start: subtractMinutes(10),
    end: subtractMinutes(9),
    overlap: ScheduleOverlapPolicy.ALLOW_ALL,
  };

  const handle = client.schedule.getHandle('sample-schedule');
  await handle.backfill(backfillOptions);

  console.log(`Schedule is now backfilled.`);
}
// @@@SNIPEND

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
