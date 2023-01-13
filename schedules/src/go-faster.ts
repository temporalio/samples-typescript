import { Connection, Client, ScheduleUpdateOptions } from '@temporalio/client';

async function run() {
  const client = new Client({
    connection: await Connection.connect(),
  });

  const handle = client.schedule.getHandle('sample-schedule');
  await handle.update((schedule: ScheduleUpdateOptions) => {
    schedule.spec.intervals = [{ every: '5m' }];
    return schedule;
  });
  // Alternatively:
  // await handle.update((schedule) => ({ ...schedule, spec: { intervals: [{ every: '5s' }] } }));

  console.log(`Schedule is now triggered every 5 seconds.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
