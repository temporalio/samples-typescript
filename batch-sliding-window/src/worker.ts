import { Worker } from '@temporalio/worker';
import { createActivities } from './activities';

async function run() {
  const activities = createActivities(90);

  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'batch-sliding-window',
  });

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
