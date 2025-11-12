import { Client, Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { isBlockedQuery } from './workflows';

async function run(): Promise<void> {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  const handle = client.workflow.getHandle('unblock-or-cancel-0');

  console.log('blocked?', await handle.query(isBlockedQuery));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
