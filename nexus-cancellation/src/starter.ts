import { nanoid } from 'nanoid';
import { Connection, Client } from '@temporalio/client';
import { cancellableCallerWorkflow } from './caller/workflows';

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
    args: ['Temporal', 'en', false],
    workflowId: 'workflow-completed-' + nanoid(),
  });
  console.log(`Completed message: ${completedMessage}`);

  // Demonstrate cancellable workflow with actual cancellation
  console.log('\n--- Testing cancellable workflow (with cancellation) ---');
  const workflowId = 'workflow-cancelled-' + nanoid();

  // Start the workflow
  const handle = await client.workflow.start(cancellableCallerWorkflow, {
    taskQueue: callerTaskQueue,
    workflowId,
    args: ['Temporal', 'en', true],
  });
  console.log(`Started cancellable workflow: ${workflowId}`);

  try {
    const cancelledMessage = await handle.result();
    console.log(`Unexpected completion: ${cancelledMessage}`);
  } catch (error: any) {
    console.log(`Workflow was cancelled as expected: ${error.message}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND
