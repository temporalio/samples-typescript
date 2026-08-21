import { NativeConnection, Worker } from '@temporalio/worker';
import { GoogleAdkPlugin } from '@temporalio/google-adk-agents';
import { offlineModelProvider } from './offline-model';
import * as activities from './activities';

async function run() {
  const connection = await NativeConnection.connect({ address: 'localhost:7233' });
  try {
    const worker = await Worker.create({
      connection,
      taskQueue: 'google-adk-tools',
      workflowsPath: require.resolve('./workflows'),
      activities,
      plugins: [
        new GoogleAdkPlugin(process.env.MODEL_PROVIDER === 'fake' ? { modelProvider: offlineModelProvider() } : {}),
      ],
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
