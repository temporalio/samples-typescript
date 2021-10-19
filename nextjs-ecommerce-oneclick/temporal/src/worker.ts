import { Worker } from '@temporalio/worker';
import * as activities from './activities';

run().catch((err) => console.log(err));

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'tutorial',
  });
  // Start accepting tasks on the `tutorial` queue
  await worker.run();
}
