import { Connection, Client } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { sinkWorkflow } from './workflows';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  // Invoke the `example` Workflow, only resolved when the workflow completes
  const result = await client.workflow.execute(sinkWorkflow, {
    taskQueue: 'sinks',
    workflowId: 'log-sample-0',
  });
  console.log(result); // Hello, Temporal!
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
