import { Connection, WorkflowClient, WorkflowFailedError, CancelledFailure } from '@temporalio/client';
import { runCancellableActivity } from './workflows';

async function run() {
  const connection = await Connection.connect();
  const client = new WorkflowClient({ connection });

  const handle = await client.start(runCancellableActivity, {
    taskQueue: 'cancellation-heartbeating',
    workflowId: 'cancellation-heartbeating-0',
  });

  // Simulate waiting for some time
  // Cancel may be immediately called, waiting is not needed
  await new Promise((resolve) => setTimeout(resolve, 40 * 1000));
  await handle.cancel();
  console.log('Cancelled workflow successfully');
  try {
    await handle.result();
  } catch (err: unknown) {
    if (err instanceof WorkflowFailedError && err.cause instanceof CancelledFailure) {
      console.log('handle.result() threw because Workflow was cancelled');
    } else {
      throw err;
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
