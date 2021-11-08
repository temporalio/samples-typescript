import { Worker } from '@temporalio/worker';

// @@@SNIPSTART typescript-activity-deps-worker
import { createActivities } from './activities';

async function run() {
  // Mock DB connection initialization in Worker
  const db = {
    async get(_key: string) {
      return 'Temporal';
    },
  };

  const worker = await Worker.create({
    taskQueue: 'dependency-injection',
    workflowsPath: require.resolve('./workflows'),
    activities: createActivities(db),
  });

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND
