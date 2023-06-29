import { Worker } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflowsV21'),
    activities,
    taskQueue: 'versioned-queue',
    buildId: '2.1',
    useVersioning: true,
  });
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
