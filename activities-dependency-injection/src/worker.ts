import { Worker } from '@temporalio/worker';
// @@@SNIPSTART typescript-activity-deps-worker
import createActivities from './activities';

async function run() {
  const worker = await Worker.create({
    workDir: __dirname,
    taskQueue: 'tutorial',
    activities: createActivities('Hola,'),
  });

  await worker.run();
}
// @@@SNIPEND

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
