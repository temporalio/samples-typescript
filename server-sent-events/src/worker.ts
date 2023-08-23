// @@@SNIPSTART typescript-hello-worker
import { NativeConnection, Worker } from '@temporalio/worker';
import { server } from './server';
import { createActivities } from './activities';

function startServer() {
  return new Promise<void>((resolve) => {
    const port = process.env['PORT'] || 3000;
    server.listen(port, () => {
      console.log(`🚀 :: server is listening on port ${port}`);
      resolve();
    });
  });
}

async function run() {
  // Step 1: Establish a connection with Temporal server.
  //
  // Worker code uses `@temporalio/worker.NativeConnection`.
  // (But in your application code it's `@temporalio/client.Connection`.)
  const connection = await NativeConnection.connect({
    address: 'localhost:7233',
  });

  // Step 2: Register Workflows and Activities with the Worker.
  const taskQueue = 'sse-task-queue';
  const worker = await Worker.create({
    connection,
    namespace: 'default',
    taskQueue,
    // Workflows are registered using a path as they run in a separate JS context.
    workflowsPath: require.resolve('./workflows'),
    activities: createActivities(taskQueue),
  });

  // Step 3: Start accepting tasks on the `sse-task-queue` queue
  //
  // The worker and server are deployed together. You could separate it, if you knew which
  // server holds which client connection.
  //
  // You can usually just push this to an external service, like Redis, as well.
  await Promise.all([worker.run(), startServer()]);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND
