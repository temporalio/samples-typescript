import { loadClientConnectConfig } from '@temporalio/envconfig';
import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';
import { greetingServiceHandler } from './handler';
import { HANDLER_NAMESPACE, TASK_QUEUE } from './shared';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await NativeConnection.connect(config.connectionOptions);
  try {
    const worker = await Worker.create({
      connection,
      namespace: config.namespace ?? HANDLER_NAMESPACE,
      taskQueue: TASK_QUEUE,
      activities,
      nexusServices: [greetingServiceHandler],
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
