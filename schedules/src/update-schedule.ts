import {
  Connection,
  Client,
  ScheduleDescription,
  ScheduleOptionsStartWorkflowAction,
  ScheduleUpdateOptions,
  Workflow,
} from '@temporalio/client';

// @@@SNIPSTART typescript-update-a-scheduled-workflow
const updateSchedule = (
  input: ScheduleDescription,
): ScheduleUpdateOptions<ScheduleOptionsStartWorkflowAction<Workflow>> => {
  const scheduleAction = input.action;

  scheduleAction.args = ['my updated schedule arg'];

  return { ...input, ...scheduleAction };
};

async function run() {
  const client = new Client({
    connection: await Connection.connect(),
  });

  const handle = client.schedule.getHandle('sample-schedule');

  await handle.update(updateSchedule);

  console.log(`Schedule is now updated.`);
}
// @@@SNIPEND

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
