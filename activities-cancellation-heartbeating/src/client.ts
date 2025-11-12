import { Connection, Client, WorkflowFailedError, CancelledFailure } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { runCancellableActivity } from './workflows';
import { setTimeout } from 'timers/promises';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  const handle = await client.workflow.start(runCancellableActivity, {
    taskQueue: 'cancellation-heartbeating',
    workflowId: 'cancellation-heartbeating-0',
  });

  // Simulate waiting for some time
  // Cancel may be immediately called, waiting is not needed
  await setTimeout(40 * 1000);
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
