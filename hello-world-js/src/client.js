import { Connection, Client } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { example } from './workflows.js';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({
    connection,
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
