/**
 * Worker for the LLM-streaming scenario.
 *
 * Runs separately from `worker.ts` so the `openai` dependency and the
 * `OPENAI_API_KEY` requirement stay isolated to this one scenario. Different
 * task queue too — the other four samples won't route work to this worker.
 *
 * Kill this worker mid-stream while `run-llm.ts` is running to trigger a
 * retry: Temporal restarts the activity on the next worker to come up, the
 * activity publishes a retry event on its second attempt, and the consumer
 * resets its rendered output.
 */
import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './llm-activities';
import { LLM_TASK_QUEUE } from './llm-shared';

async function run() {
  const connection = await NativeConnection.connect({
    address: 'localhost:7233',
  });
  try {
    const worker = await Worker.create({
      connection,
      namespace: 'default',
      taskQueue: LLM_TASK_QUEUE,
      workflowsPath: require.resolve('./llm-workflows'),
      activities,
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
