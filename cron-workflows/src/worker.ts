import { Worker } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
  // nothing different here compared to hello world
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'cron-workflows',
  });
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
