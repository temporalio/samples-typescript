import { Client, Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { trackState } from './workflows';

async function run(): Promise<void> {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  const _handle = await client.workflow.start(trackState, {
    taskQueue: 'state',
    workflowId: 'state-id-0',
  });

  console.log("Workflow 'state-id-0' started. You can now signal, query, or cancel it.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
