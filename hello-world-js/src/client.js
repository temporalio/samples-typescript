import { Connection, WorkflowClient } from '@temporalio/client';
import { example } from './workflows.js';

async function run() {
  const connection = new Connection({
    // // Connect to localhost with default ConnectionOptions.
    // // In production, pass options to the Connection constructor to configure TLS and other settings:
    // address: 'foo.bar.tmprl.cloud', // as provisioned
    // tls: {} // as provisioned
  });

  const client = new WorkflowClient(connection.service, {
    // namespace: 'default', // change if you have a different namespace
  });

  // Invoke the `example` Workflow, only resolved when the workflow completes
  const result = await client.execute(example, {
    taskQueue: 'hello-javascript',
    workflowId: 'my-business-id',
    args: ['Temporal'],
  });
  console.log(result); // Hello, Temporal!
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
