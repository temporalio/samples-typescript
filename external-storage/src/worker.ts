import { Worker } from '@temporalio/worker';
import * as activities from './activities';
import { PAYLOAD_SIZE_THRESHOLD, STORAGE_ROOT, createDataConverter } from './data-converter';
import { TASK_QUEUE } from './shared';

async function run() {
  console.log(`Offloading payloads of ${PAYLOAD_SIZE_THRESHOLD} bytes or more to ${STORAGE_ROOT}`);

  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: TASK_QUEUE,

    // The Worker stores payloads on the way out (Activity arguments, Activity and
    // Workflow results, heartbeat details) and retrieves them on the way in. Run a
    // second copy of this Worker and it will read blobs the first one wrote, without
    // any coordination beyond both drivers pointing at the same storage.
    dataConverter: createDataConverter(),
  });

  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
