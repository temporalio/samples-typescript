import { Worker } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
  // @@@SNIPSTART typescript-production-worker
  const worker = await Worker.create({
    ...(process.env.NODE_ENV === 'production'
      ? { workflowBundle: { path: require.resolve('../workflow-bundle.js') } }
      : { workflowsPath: require.resolve('./workflows') }),
    activities,
    taskQueue: 'tutorial',
  });
  // @@@SNIPEND

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
