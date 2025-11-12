import { Client, Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { loopingWorkflow } from './workflows';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  const result = await client.workflow.execute(loopingWorkflow, { taskQueue: 'continue-as-new', workflowId: 'loop-0' });
  console.log(result); // Hello, Temporal!
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
