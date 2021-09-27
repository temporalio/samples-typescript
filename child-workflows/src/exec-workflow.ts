import { Connection, WorkflowClient } from '@temporalio/client';
import { childWorkflowExample } from './workflows';

async function run() {
  // Connect to localhost with default ConnectionOptions,
  // pass options to the Connection constructor to configure TLS and other settings.
  const connection = new Connection();
  // Workflows will be started in the "default" namespace unless specified otherwise
  // via options passed the WorkflowClient constructor.
  const client = new WorkflowClient(connection.service);
  // Create a typed handle for the childWorkflowExample Workflow.
  const workflow = client.createWorkflowHandle(childWorkflowExample, { taskQueue: 'tutorial' });
  const result = await workflow.execute(['Alice', 'Bob', 'Charlie']);
  console.log(result);
  // i am a child named Alice
  // i am a child named Bob
  // i am a child named Charlie
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
