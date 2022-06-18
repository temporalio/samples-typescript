import { Connection, WorkflowClient } from '@temporalio/client';
import { logSampleWorkflow } from './workflows';

async function run() {
  const connection = await Connection.connect(); // Connect to localhost with default ConnectionOptions.
  // In production, pass options to the Connection constructor to configure TLS and other settings.
  // This is optional but we leave this here to remind you there is a gRPC connection being established.

  const client = new WorkflowClient({
    connection,
    // In production you will likely specify `namespace` here; it is 'default' if omitted
  });

  // Invoke the `example` Workflow, only resolved when the workflow completes
  const result = await client.execute(logSampleWorkflow, {
    taskQueue: 'logging-sinks',
    workflowId: 'log-sample-0',
  });
  console.log(result); // Hello, Temporal!
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
