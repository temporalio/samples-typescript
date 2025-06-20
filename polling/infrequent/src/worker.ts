// @@@SNIPSTART typescript-polling-frequent
import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
  const connection = await NativeConnection.connect({
    address: 'localhost:7233',
  });
  try {
    const worker = await Worker.create({
      connection,
      namespace: 'default',
      taskQueue: 'frequent-activity-polling-task-queue',
      workflowsPath: require.resolve('./workflows'),
      activities,
    });
    await worker.run();
  } finally {
    // Close the connection once the worker has stopped
    await connection.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND
