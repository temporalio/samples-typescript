// @ts-nocheck
import { Connection, WorkflowClient } from '@temporalio/client';
import { WorkflowA, WorkflowB } from 'temporal-workflows/src/all-workflows';

export async function runWorkflow() {
  const connection = new Connection(); // Connect to localhost with default ConnectionOptions.
  // In production, pass options to the Connection constructor to configure TLS and other settings.
  // This is optional but we leave this here to remind you there is a gRPC connection being established.

  const client = new WorkflowClient(connection.service, {
    // In production you will likely specify `namespace` here; it is 'default' if omitted
    workflowDefaults: { taskQueue: 'tutorial' },
  });

  // Invoke the `WorkflowA` Workflow, only resolved when the workflow completes
  const result = await client.execute(WorkflowA, {
    args: ['Temporal'], // type inference works! args: [name: string]
  });
  // Starts the `WorkflowB` Workflow, don't wait for it to complete
  await client.start(WorkflowB);
  console.log(result); // Hello, Temporal!
  return result;
}

// run().catch((err) => {
//   console.error(err);
//   process.exit(1);
// });
