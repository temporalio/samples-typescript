// @@@SNIPSTART typescript-send-query
import { Client } from '@temporalio/client';
import { getValueQuery } from './workflows';

async function run(): Promise<void> {
  const client = new Client();
  const handle = client.workflow.getHandle('state-id-0');
  const meaning = await handle.query(getValueQuery, 'meaning-of-life');
  console.log({ meaning });
}
// @@@SNIPEND

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
