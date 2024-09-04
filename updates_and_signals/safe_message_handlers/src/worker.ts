import { Worker } from '@temporalio/worker';
import path from 'path';
import * as activities from './activities';

async function run() {
  const worker = await Worker.create({
    workflowsPath: path.join(__dirname, './workflows.ts'),
    activities,
    taskQueue: 'safe-message-handlers-task-queue',
  });

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
