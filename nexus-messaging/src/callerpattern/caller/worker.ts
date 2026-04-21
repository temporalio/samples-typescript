import { NativeConnection, Worker } from '@temporalio/worker';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { CALLER_NAMESPACE } from '../api';

const CALLER_TASK_QUEUE = 'nexus-messaging-caller-task-queue';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await NativeConnection.connect(config.connectionOptions);
  try {
    const worker = await Worker.create({
      connection,
      namespace: CALLER_NAMESPACE,
      taskQueue: CALLER_TASK_QUEUE,
      workflowsPath: require.resolve('./workflows'),
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
