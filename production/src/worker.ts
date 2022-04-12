import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';
import { connectionOptions, namespace } from './connection';

// @@@SNIPSTART typescript-production-worker
const workflowOption = () =>
  process.env.NODE_ENV === 'production'
    ? { workflowBundle: { path: require.resolve('../workflow-bundle.js') } }
    : { workflowsPath: require.resolve('./workflows') };

async function run() {
  const connection = await NativeConnection.create(connectionOptions);

  const worker = await Worker.create({
    connection,
    namespace,
    ...workflowOption(),
    activities,
    taskQueue: 'production-sample',
  });

  await worker.run();
}
// @@@SNIPEND

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
