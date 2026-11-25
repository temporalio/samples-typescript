import { NativeConnection, Worker } from '@temporalio/worker';
import { createSampleCodec } from '../codec-config';
import { CALLER } from '../shared';

async function run() {
  const connection = await NativeConnection.connect({ address: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233' });
  try {
    const worker = await Worker.create({
      connection,
      namespace: CALLER,
      taskQueue: CALLER,
      workflowsPath: require.resolve('./workflows'),
      dataConverter: { payloadCodecs: [createSampleCodec()] },
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
