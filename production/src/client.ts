import { Connection, WorkflowClient } from '@temporalio/client';
import { example } from './workflows';

async function run() {
  const connection = await Connection.connect(); // Connect to localhost with default ConnectionOptions.
  // In production, pass options to the Connection constructor to configure TLS and other settings.
  // This is optional but we leave this here to remind you there is a gRPC connection being established.

  const client = new WorkflowClient({
    connection,
    // In production you will likely specify `namespace` here; it is 'default' if omitted
  });

  const result = await client.execute(example, {
    taskQueue: 'production-sample',
    workflowId: 'production-sample-0',
    args: ['Temporal'],
  });
  console.log(result); // Hello, Temporal!
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
