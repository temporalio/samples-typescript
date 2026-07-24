import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';
import { TASK_QUEUE } from './shared';

async function run() {
  const connection = await NativeConnection.connect({
    address: 'localhost:7233',
  });
  try {
    const worker = await Worker.create({
      connection,
      namespace: 'default',
      taskQueue: TASK_QUEUE,
      workflowsPath: require.resolve('./workflows'),
      activities,
    });
    await worker.run();
  } finally {
    await connection.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
