// @@@SNIPSTART typescript-custom-activity-type
import { Worker } from '@temporalio/worker';
import { greet } from './activities';

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    taskQueue: 'snippets',
    activities: {
      activityFoo: greet,
    },
  });

  await worker.run();
}
// @@@SNIPEND

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
