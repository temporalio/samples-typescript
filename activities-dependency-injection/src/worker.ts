import { Worker } from '@temporalio/worker';
import path from 'path';

// @@@SNIPSTART typescript-activity-deps-worker
import { createActivities } from './activities';

async function run() {
  // mock db connection initialization in Worker
  const dbConnection = async () => 'Temporal' 
  
  const worker = await Worker.create({
    workflowsPath: path.join(__dirname, 'workflows'),
    nodeModulesPath: path.join(__dirname, '../node_modules'),
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
