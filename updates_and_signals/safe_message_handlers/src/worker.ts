import { Worker } from '@temporalio/worker';
import path from 'path';

async function run() {
  const worker = await Worker.create({
    workflowsPath: path.join(__dirname, './workflows.ts'),
    taskQueue: 'safe-message-handlers-task-queue',
  });

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
