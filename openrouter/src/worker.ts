import { NativeConnection, Worker } from '@temporalio/worker';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { buildClient, createActivities } from './activities';
import { TASK_QUEUE } from './shared';

async function run() {
  // Same connection settings as the client, so a profile that points at a
  // remote server moves both the starter and the Worker.
  const config = loadClientConnectConfig();
  const connection = await NativeConnection.connect(config.connectionOptions);
  try {
    // One OpenRouter client for the Worker's lifetime, shared by every
    // concurrent Activity. Reads OPENROUTER_API_KEY from the environment.
    const activities = createActivities(buildClient());

    const worker = await Worker.create({
      connection,
      namespace: config.namespace ?? 'default',
      taskQueue: TASK_QUEUE,
      // Workflows are registered using a path as they run in a separate JS context.
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
