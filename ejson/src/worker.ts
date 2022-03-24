import { Worker } from '@temporalio/worker';

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    taskQueue: 'ejson',
    dataConverter: { payloadConverterPath: require.resolve('./payload-converter') },
  });

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
