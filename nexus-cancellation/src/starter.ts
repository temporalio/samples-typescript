import { nanoid } from 'nanoid';
import { Connection, Client, WorkflowFailedError } from '@temporalio/client';
import { cancellableCallerWorkflow, cancellableCallerWorkflowCancel } from './caller/workflows';
import { isCancellation } from '@temporalio/workflow';

async function run() {
  const callerTaskQueue = 'nexus-cancellation-caller-task-queue';

  const connection = await Connection.connect({ address: 'localhost:7233' });
  const client = new Client({
    connection,
    namespace: 'my-caller-namespace',
  });

  // Demonstrate cancellable workflow - let it complete normally
  console.log('\n--- Testing cancellable workflow (normal completion) ---');
  const completedMessage = await client.workflow.execute(cancellableCallerWorkflow, {
    taskQueue: callerTaskQueue,
    args: ['Temporal', 'en'],
    workflowId: 'workflow-completed-' + nanoid(),
  });
  console.log(`Completed message: ${completedMessage}`);

  // Demonstrate cancellable workflow with actual cancellation
  console.log('\n--- Testing cancellable workflow (with cancellation) ---');
  const workflowId = 'workflow-cancelled-' + nanoid();

  // Start the workflow
  const handle = await client.workflow.signalWithStart(cancellableCallerWorkflow, {
    taskQueue: callerTaskQueue,
    workflowId,
    args: ['Temporal', 'en'],
    signal: cancellableCallerWorkflowCancel,
  });
  console.log(`Started cancellable workflow: ${workflowId}, sent cancellation signal`);

  try {
    const cancelledMessage = await handle.result();
    console.log(`Unexpected completion: ${cancelledMessage}`);
  } catch (error: unknown) {
    if (isCancellation((error as WorkflowFailedError).cause)) {
      console.log(`Workflow was cancelled as expected: ${(error as Error).message}`);
    } else {
      throw error;
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND
