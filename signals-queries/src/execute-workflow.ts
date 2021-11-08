import { WorkflowClient } from '@temporalio/client';
import { unblockOrCancel, unblockSignal, isBlockedQuery } from './workflows';

async function run(): Promise<void> {
  const client = new WorkflowClient();

  const handle = await client.start(unblockOrCancel, { taskQueue: 'signals-queries' });

  console.log('blocked?', await handle.query(isBlockedQuery)); // true

  // To cancel instead of completing the Workflow, replace signal with: await handle.cancel()
  await handle.signal(unblockSignal);

  await handle.result();
  console.log('blocked?', await handle.query(isBlockedQuery)); // false
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
