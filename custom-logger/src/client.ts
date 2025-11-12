import { nanoid } from 'nanoid';
import { Connection, Client } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { logSampleWorkflow } from './workflows';

async function run() {
  // Load client configuration from config file.
  // (see: https://docs.temporal.io/develop/environment-configuration)
  // In production, you can configure TLS and other settings in your config file.
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

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
