// @@@SNIPSTART nodejs-hello-worker
import { Worker } from '@temporalio/worker';
import path from 'path';
import * as activities from './activities';

run().catch((err) => console.log(err));

async function run() {
  // Step 1: Register Workflows relative to __dirname.
  const worker = await Worker.create({
    workflowsPath: path.join(__dirname, 'workflows'),
    nodeModulesPath: path.join(__dirname, '../node_modules'),
    activities,
    taskQueue: 'tutorial',
  });
  // // Worker connects to localhost by default and uses console.error for logging.
  // // Customize the Worker by passing more options to create():
  // // https://nodejs.temporal.io/api/classes/worker.Worker
  
  // // If you need to configure server connection parameters, see the mTLS example:
  // // https://github.com/temporalio/samples-node/tree/main/hello-world-mtls
  
  
  // Step 2: Start accepting tasks on the `tutorial` queue
  await worker.run();
  
  // You may create multiple Workers in a single process in order to poll on multiple task queues.
}
// @@@SNIPEND
