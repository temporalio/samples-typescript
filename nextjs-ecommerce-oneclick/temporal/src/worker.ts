import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';

run().catch((err) => console.log(err));

async function run() {
  const connection = await NativeConnection.connect({
    address: 'localhost:7233',
    // In production, pass options to configure TLS and other settings.
  });
  try {
    const worker = await Worker.create({
      connection,
      workflowsPath: require.resolve('./workflows'),
      activities,
      taskQueue: 'ecommerce-oneclick',
    });
    await worker.run();
  } finally {
    connection.close();
  }
}
