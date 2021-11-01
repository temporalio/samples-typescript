// @@@SNIPSTART typescript-hello-client
import { Connection, WorkflowClient } from '@temporalio/client';
import { example } from './workflows';

async function run() {
  // Connect to localhost with default ConnectionOptions,
  // pass options to the Connection constructor to configure TLS and other settings.
  const connection = new Connection();
  const client = new WorkflowClient(connection.service, {
    // Workflows will be started in the "default" namespace unless specified otherwise
    workflowDefaults: { taskQueue: 'tutorial' },
  });

  // Invoke the `example` Workflow, only resolved when the workflow completes
  const result = await client.execute(example, {
    args: ['Temporal'], // type inferred: args: [name: string]
  });
  console.log(result); // Hello, Temporal!
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND
