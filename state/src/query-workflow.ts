// @@@SNIPSTART typescript-send-query
import { WorkflowClient } from '@temporalio/client';
import { getValueQuery } from './workflows';

async function run(): Promise<void> {
  const client = new WorkflowClient();
  const handle = client.getHandle('state-id-0');
  const meaning = await handle.query(getValueQuery, 'meaning-of-life');
  console.log({ meaning });
}
// @@@SNIPEND

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
