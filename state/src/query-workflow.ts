// @@@SNIPSTART typescript-send-query
import { Client, Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { getValueQuery } from './workflows';

async function run(): Promise<void> {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });
  const handle = client.workflow.getHandle('state-id-0');
  const meaning = await handle.query(getValueQuery, 'meaning-of-life');
  console.log({ meaning });
}
// @@@SNIPEND

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
