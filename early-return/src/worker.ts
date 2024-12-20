import { Worker } from '@temporalio/worker';
import { taskQueue } from './shared';

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    taskQueue,
  });

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
