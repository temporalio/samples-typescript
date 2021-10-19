import { Worker } from '@temporalio/worker';
import { createStickyActivities, createNonStickyActivities } from './activities';
import { v4 as uuid } from 'uuid';

// @@@SNIPSTART nodejs-sticky-queues-worker
async function run() {
  const uniqueWorkerTaskQueue = uuid();

  const workers = await Promise.all([
    Worker.create({
      workflowsPath: require.resolve('./workflows'),
      activities: createNonStickyActivities(uniqueWorkerTaskQueue),
      taskQueue: 'sticky-activity-tutorial',
    }),
    Worker.create({
      // No workflows for this queue
      activities: createStickyActivities(),
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
