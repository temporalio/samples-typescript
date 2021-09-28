import { Worker } from '@temporalio/worker';
import path from 'path';
import * as activities from './activities';

run().catch((err) => console.log(err));

async function run() {
  const worker = await Worker.create({
    workflowsPath: path.join(__dirname, 'workflows'),
    nodeModulesPath: path.join(__dirname, '../node_modules'),
    activities,
    taskQueue: 'tutorial20210915',
  });

  await worker.run();
}
