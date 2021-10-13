import { Worker } from '@temporalio/worker';

// @@@SNIPSTART typescript-activity-deps-worker
import { createActivities } from './activities';

async function run() {
  // Mock DB connection initialization in Worker
  const db = {
    async get(_key: string) {
      // eslint-disable-line @typescript-eslint/no-unused-vars
      return 'Temporal';
    },
  };

  const worker = await Worker.create({
    taskQueue: 'tutorial',
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
