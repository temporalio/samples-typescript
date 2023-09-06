import { nanoid } from 'nanoid';
import { Connection, Client } from '@temporalio/client';
import { logSampleWorkflow } from './workflows';

async function run() {
  const connection = await Connection.connect(); // Connect to localhost with default ConnectionOptions.
  // In production, pass options to the Connection constructor to configure TLS and other settings.
  // This is optional but we leave this here to remind you there is a gRPC connection being established.

  const client = new Client({
    connection,
    // In production you will likely specify `namespace` here; it is 'default' if omitted
  });

  // Invoke the `logSampleWorkflow` Workflow, only resolved when the workflow completes
  await client.workflow.execute(logSampleWorkflow, {
    taskQueue: 'custom-logger',
    workflowId: 'workflow-' + nanoid(),
  });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
