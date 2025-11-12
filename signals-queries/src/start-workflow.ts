import { Client, Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { unblockOrCancel } from './workflows';

async function run(): Promise<void> {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  const _handle = await client.workflow.start(unblockOrCancel, {
    taskQueue: 'signals-queries',
    workflowId: 'unblock-or-cancel-0',
  });

  console.log("Workflow 'unblock-or-cancel-0' started, now you can signal, query, or cancel it");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
