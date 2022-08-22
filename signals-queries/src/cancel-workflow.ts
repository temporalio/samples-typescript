import { WorkflowClient } from '@temporalio/client';

async function run(): Promise<void> {
  const client = new WorkflowClient();

  const handle = client.getHandle('unblock-or-cancel-0');

  await handle.cancel();
  console.log('workflow canceled');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
