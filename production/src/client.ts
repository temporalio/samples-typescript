import { Connection, Client } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { example } from './workflows';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  const result = await client.workflow.execute(example, {
    taskQueue: 'production-sample',
    workflowId: 'production-sample-0',
    args: ['Temporal'],
  });
  console.log(result); // Hello, Temporal!
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
