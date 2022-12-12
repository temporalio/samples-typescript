import { Connection, Client } from '@temporalio/client';
import { example } from './workflows.js';

async function run() {
  const connection = await Connection.connect({
    // // Connect to localhost with default ConnectionOptions.
    // // In production, pass options to the Connection constructor to configure TLS and other settings:
    // address: 'foo.bar.tmprl.cloud', // as provisioned
    // tls: {} // as provisioned
  });

  const client = new Client({
    connection,
    // namespace: 'default', // change if you have a different namespace
  });

  // Invoke the `example` Workflow, only resolved when the workflow completes
  const result = await client.workflow.execute(example, {
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
