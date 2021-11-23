import { WorkflowClient } from '@temporalio/client';
import { unblockOrCancel } from './workflows';

async function run(): Promise<void> {
  const client = new WorkflowClient();

  const handle = await client.start(unblockOrCancel, {
    taskQueue: 'signals-queries',
    workflowId: 'unblock-or-cancel-0',
  });

  console.log("Workflow 'unblock-or-cancel-0' started, now you can signal, query, or cancel it")
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
