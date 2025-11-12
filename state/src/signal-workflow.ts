import { Client, Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { setValueSignal } from './workflows';

async function run(): Promise<void> {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  const handle = client.workflow.getHandle('state-id-0');

  await handle.signal(setValueSignal, 'meaning-of-life', 42);
  console.log('setValueSignal sent');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
