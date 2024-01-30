// @@@SNIPSTART typescript-update-worker
import { NativeConnection, Worker } from '@temporalio/worker';

async function run() {
  const connection = await NativeConnection.connect({
    address: 'localhost:7233',
  });
  const worker = await Worker.create({
    connection,
    namespace: 'default',
    taskQueue: 'my-task-queue',
    workflowsPath: require.resolve('./workflows'),
  });
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND
