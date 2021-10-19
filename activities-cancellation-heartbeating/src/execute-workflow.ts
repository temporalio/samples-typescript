import { Connection, WorkflowClient, WorkflowExecutionCancelledError } from '@temporalio/client';
import { runCancellableActivity } from './workflows';

async function run() {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);

  const handle = client.createWorkflowHandle(runCancellableActivity, { taskQueue: 'tutorial' });

  await handle.start();

  await new Promise((resolve) => setTimeout(resolve, 100));
  await handle.cancel();
  console.log('Cancelled workflow successfully');
  try {
    await handle.result();
  } catch (err: unknown) {
    if (err instanceof WorkflowExecutionCancelledError) {
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
