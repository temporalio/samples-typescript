import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';
import { DEPLOYMENT_NAME, TASK_QUEUE } from './constants';

async function run(): Promise<void> {
  const connection = await NativeConnection.connect();
  try {
    const worker = await Worker.create({
      connection,
      namespace: 'default',
      taskQueue: TASK_QUEUE,
      activities,
      workflowsPath: require.resolve('./workflows-v1'),
      workerDeploymentOptions: {
        version: { deploymentName: DEPLOYMENT_NAME, buildId: '1.0' },
        useWorkerVersioning: true,
        defaultVersioningBehavior: 'PINNED',
      },
    });

    console.info('Starting worker v1 (build 1.0)');
    await worker.run();
  } finally {
    await connection.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
