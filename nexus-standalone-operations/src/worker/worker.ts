import { NativeConnection, Worker } from '@temporalio/worker';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { TASK_QUEUE } from '../shared';
import { myNexusServiceHandler } from './handler';

async function run() {
  // The connection is configured via the SDK's environment configuration support, which reads
  // TEMPORAL_ADDRESS, TEMPORAL_NAMESPACE, etc. from the environment (and optionally a profile from
  // temporal.toml). The worker runs in the handler namespace (see README).
  const config = loadClientConnectConfig();
  const connection = await NativeConnection.connect(config.connectionOptions);
  try {
    const worker = await Worker.create({
      connection,
      namespace: config.namespace ?? 'default',
      taskQueue: TASK_QUEUE,
      workflowsPath: require.resolve('./workflows'),
      nexusServices: [myNexusServiceHandler],
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
