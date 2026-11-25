import { NativeConnection, Worker } from '@temporalio/worker';
import { createSampleCodec } from '../codec-config';
import { COMPRESSED_HANDLER, ENCRYPTED_HANDLER } from '../shared';
import { syncHandler, asyncHandler } from './handler';

async function run() {
  const role = process.argv[2];
  if (role !== 'compressed' && role !== 'encrypted') throw new Error('Choose compressed or encrypted');
  const namespace = role === 'compressed' ? COMPRESSED_HANDLER : ENCRYPTED_HANDLER;
  const connection = await NativeConnection.connect({ address: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233' });
  try {
    const worker = await Worker.create({
      connection,
      namespace,
      taskQueue: namespace,
      workflowsPath: require.resolve('./workflows'),
      nexusServices: [syncHandler, asyncHandler],
      dataConverter: { payloadCodecs: [createSampleCodec(role)] },
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
