import { Worker } from '@temporalio/worker';
import path from 'path';

run().catch((err) => console.log(err));

async function run() {
  const worker = await Worker.create({
    workflowsPath: path.join(__dirname, 'workflows'),
    nodeModulesPath: path.join(__dirname, '../node_modules'),
    taskQueue: 'tutorial',
  });

  await worker.run();
}
