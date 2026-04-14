import { Worker, NativeConnection } from '@temporalio/worker';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { nexusRemoteGreetingServiceHandler } from './handler';
import { createActivities } from './activities';
import { HANDLER_NAMESPACE, HANDLER_TASK_QUEUE } from '../api';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await NativeConnection.connect(config.connectionOptions);
  try {
    const worker = await Worker.create({
      connection,
      namespace: HANDLER_NAMESPACE,
      taskQueue: HANDLER_TASK_QUEUE,
      workflowsPath: require.resolve('./workflows'),
      activities: createActivities(),
      nexusServices: [nexusRemoteGreetingServiceHandler as any],
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
