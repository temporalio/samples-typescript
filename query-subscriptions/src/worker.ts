import Redis from 'ioredis';
import { Worker } from '@temporalio/worker';
import { createActivities } from './activities';
import { taskQueue } from './env';

async function main() {
  const redis = new Redis();

  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities: createActivities(redis),
    taskQueue,
    interceptors: {
      workflowModules: [require.resolve('./workflows/subscriptions')],
    },
  });
  await worker.run();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
