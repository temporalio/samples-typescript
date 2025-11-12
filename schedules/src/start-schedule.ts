import { Connection, Client, ScheduleOverlapPolicy } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { reminder } from './workflows';

// @@@SNIPSTART typescript-create-a-scheduled-workflow
async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  // https://typescript.temporal.io/api/classes/client.ScheduleClient#create
  const schedule = await client.schedule.create({
    action: {
      type: 'startWorkflow',
      workflowType: reminder,
      args: ['♻️ Dear future self, please take out the recycling tonight. Sincerely, past you ❤️'],
      taskQueue: 'schedules',
    },
    scheduleId: 'sample-schedule',
    policies: {
      catchupWindow: '1 day',
      overlap: ScheduleOverlapPolicy.ALLOW_ALL,
    },
    spec: {
      intervals: [{ every: '10s' }],
      // or periodic calendar times:
      // calendars: [
      //   {
      //     comment: 'every wednesday at 8:30pm',
      //     dayOfWeek: 'WEDNESDAY',
      //     hour: 20,
      //     minute: 30,
      //   },
      // ],
      // or a single datetime:
      // calendars: [
      //   {
      //     comment: '1/1/23 at 9am',
      //     year: 2023,
      //     month: 1,
      //     dayOfMonth: 1,
      //     hour: 9,
      //   },
      // ],
    },
  });
  // @@@SNIPEND

  console.log(`Started schedule '${schedule.scheduleId}'.

The reminder Workflow will run and log from the Worker every 10 seconds.

You can now run:

  npm run schedule.go-faster
  npm run schedule.pause
  npm run schedule.unpause
  npm run schedule.delete
  npm run schedule.describe
  npm run schedule.backfill
  npm run schedule.list
  npm run schedule.trigger
  npm run schedule.update
`);

  await client.connection.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
