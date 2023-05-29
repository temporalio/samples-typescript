import { Worker } from '@temporalio/worker';
import { createActivitiesForSameWorker, createNormalActivities } from './activities';
import { v4 as uuid } from 'uuid';

// @@@SNIPSTART typescript-sticky-queues-worker
async function run() {
  const uniqueWorkerTaskQueue = uuid();

  const workers = await Promise.all([
    Worker.create({
      workflowsPath: require.resolve('./workflows'),
      activities: createNormalActivities(uniqueWorkerTaskQueue),
      taskQueue: 'normal-task-queue',
    }),
    Worker.create({
      // No workflows for this queue
      activities: createActivitiesForSameWorker(),
      taskQueue: uniqueWorkerTaskQueue,
    }),
  ]);
  await Promise.all(workers.map((w) => w.run()));
}
// @@@SNIPEND

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
