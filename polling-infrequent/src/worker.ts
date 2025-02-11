import { NativeConnection, Worker, WorkerOptions } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
  const connection = await NativeConnection.connect({
    address: 'localhost:7233',
  });
  try {
    const x: WorkerOptions = {
      connection,
      namespace: 'default',
      taskQueue: 'hello-world',
      workflowsPath: require.resolve('./workflows'),
      activities,
    };

    const worker = await Worker.create(x);

    await worker.run();
  } finally {
    await connection.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
