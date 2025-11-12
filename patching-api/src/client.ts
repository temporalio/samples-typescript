import { Client, Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { myWorkflow, workflowId } from './workflows';

async function run(): Promise<void> {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });
  await client.workflow.start(myWorkflow, { taskQueue: 'patching', workflowId });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
