// @@@SNIPSTART typescript-worker-create
import { Worker } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    taskQueue: 'snippets',
    activities,
  });

  await worker.run();
}
// @@@SNIPEND

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
