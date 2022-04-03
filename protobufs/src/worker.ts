import { Worker } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
  // @@@SNIPSTART typescript-protobuf-worker
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'protobufs',
    dataConverter: { payloadConverterPath: require.resolve('./payload-converter') },
  });
  // @@@SNIPEND

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
