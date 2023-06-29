import { Worker } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflowsV1'),
    activities,
    taskQueue: 'versioned-queue',
    buildId: '1.0',
    useVersioning: true,
  });
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
