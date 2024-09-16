// @@@SNIPSTART typescript-message-passing-introduction
import * as wo from '@temporalio/worker';
import { activities } from './workflows';

async function run() {
  const connection = await wo.NativeConnection.connect({
    address: 'localhost:7233',
  });
  const worker = await wo.Worker.create({
    connection,
    namespace: 'default',
    taskQueue: 'my-task-queue',
    workflowsPath: require.resolve('./workflows'),
    activities,
  });
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND
