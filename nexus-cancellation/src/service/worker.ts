import { Worker, NativeConnection } from '@temporalio/worker';
import { helloServiceHandler } from './handler';

async function run() {
  const connection = await NativeConnection.connect({
    address: 'localhost:7233',
  });
  try {
    const namespace = 'my-target-namespace';
    const serviceTaskQueue = 'my-handler-task-queue';
    const worker = await Worker.create({
      connection,
      namespace,
      taskQueue: serviceTaskQueue,
      workflowsPath: require.resolve('./workflows'),
      nexusServices: [helloServiceHandler],
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
