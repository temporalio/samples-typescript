import { Worker } from '@temporalio/worker';
import { getDataConverter } from './data-converter';

async function run() {
  // @@@SNIPSTART typescript-encryption-worker
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    taskQueue: 'encryption',
    dataConverter: await getDataConverter(),
  });
  // @@@SNIPEND

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
