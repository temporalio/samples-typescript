import { Connection, Client } from '@temporalio/client';
import { WorkflowA, WorkflowB } from 'temporal-workflows/src/all-workflows';

export async function runWorkflow() {
  const connection = await Connection.connect(); // Connect to localhost with default ConnectionOptions.
  // In production, pass options to the Connection constructor to configure TLS and other settings.
  // This is optional but we leave this here to remind you there is a gRPC connection being established.

  const client = new Client({
    connection,
    // In production you will likely specify `namespace` here; it is 'default' if omitted
  });

  // Invoke the `WorkflowA` Workflow, only resolved when the workflow completes
  const result = await client.workflow.execute(WorkflowA, {
    taskQueue: 'monorepo',
    workflowId: 'workflow-a-' + Date.now(), // TODO: remember to replace this with a meaningful business ID
    args: ['Temporal'], // type inference works! args: [name: string]
  });
  // Starts the `WorkflowB` Workflow, don't wait for it to complete
  await client.workflow.start(WorkflowB, {
    taskQueue: 'monorepo',
    workflowId: 'workflow-b-' + Date.now(), // TODO: remember to replace this with a meaningful business ID
  });
  console.log(result); // // [api-server] A: Hello, Temporal!, B: Hello, Temporal!
  return result;
}
