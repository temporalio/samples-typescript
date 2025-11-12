import { Client, Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';

async function run(): Promise<void> {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  const handle = client.workflow.getHandle('state-id-0');

  await handle.cancel();
  console.log('workflow canceled');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
