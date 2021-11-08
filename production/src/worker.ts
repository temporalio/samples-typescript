import { Worker } from '@temporalio/worker';
import * as activities from './activities';

// @@@SNIPSTART typescript-production-worker
const workflowOption = () =>
  process.env.NODE_ENV === 'production'
    ? { workflowBundle: { path: require.resolve('../workflow-bundle.js') } }
    : { workflowsPath: require.resolve('./workflows') };

async function run() {
  const worker = await Worker.create({
    ...workflowOption(),
    activities,
    taskQueue: 'production-sample',
  });

  await worker.run();
}
// @@@SNIPEND

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
