import { Worker } from '@temporalio/worker';

run().catch((err) => console.log(err));

async function run() {
  const worker = await Worker.create({
    workDir: __dirname,
    taskQueue: 'tutorial20210915',
  });

  await worker.run();
}
