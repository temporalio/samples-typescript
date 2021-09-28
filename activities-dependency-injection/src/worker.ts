import { Worker } from '@temporalio/worker';

// @@@SNIPSTART typescript-activity-deps-worker
import { createActivities } from './activities';

async function run() {
  // mock db connection initialization in Worker
  const dbConnection = async () => 'Temporal' 
  
  const worker = await Worker.create({
    workDir: __dirname,
    taskQueue: 'tutorial',
    activities: createActivities(dbConnection),
  });

  await worker.run();
}
// @@@SNIPEND

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
