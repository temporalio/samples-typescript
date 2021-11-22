import { WorkflowClient } from '@temporalio/client';
import { isBlockedQuery } from './workflows';

async function run(): Promise<void> {
  const client = new WorkflowClient();

  const handle = await client.getHandle('unblock-or-cancel-0');

  console.log('blocked?', await handle.query(isBlockedQuery));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
