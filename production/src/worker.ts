import { NativeConnection, Worker } from '@temporalio/worker';
import { serve } from 'micri';
import * as activities from './activities';
import { connectionOptions, namespace } from './connection';

// @@@SNIPSTART typescript-production-worker
const workflowOption = () =>
  process.env.NODE_ENV === 'production'
    ? {
        workflowBundle: {
          codePath: require.resolve('../workflow-bundle.js'),
          sourceMapPath: require.resolve('../workflow-bundle.js.map'),
        },
      }
    : { workflowsPath: require.resolve('./workflows') };

async function run() {
  console.log('connectionOptions:', connectionOptions);
  const connection = await NativeConnection.connect(connectionOptions);

  const worker = await Worker.create({
    connection,
    namespace,
    ...workflowOption(),
    activities,
    taskQueue: 'production-sample',
  });

  const server = serve(async () => {
    return worker.getStatus();
  });

  server.listen(process.env.PORT || 3000);

  server.on('error', (err) => {
    console.error(err);
  });

  for (const signal of ['SIGINT', 'SIGTERM', 'SIGQUIT', 'SIGUSR2']) {
    process.on(signal, () => server.close());
  }

  await worker.run();
}
// @@@SNIPEND

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
