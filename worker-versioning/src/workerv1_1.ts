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
      workflowsPath: require.resolve('./workflows-v1_1'),
      workerDeploymentOptions: {
        version: { deploymentName: DEPLOYMENT_NAME, buildId: '1.1' },
        useWorkerVersioning: true,
        defaultVersioningBehavior: 'PINNED',
      },
    });

    console.info('Starting worker v1.1 (build 1.1)');
    await worker.run();
  } finally {
    await connection.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
