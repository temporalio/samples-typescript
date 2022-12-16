import { Client } from '@temporalio/client';
import { processOrderWorkflow } from '../workflows';

async function run(): Promise<void> {
  const client = new Client();

  // Sends email to `process.env.ADMIN_EMAIL` that order processing is slow
  const result = await client.workflow.execute(processOrderWorkflow, {
    taskQueue: 'timer-examples',
    workflowId: 'process-order-0',
    args: [{ orderProcessingMS: 1000, sendDelayedEmailTimeoutMS: 100 }],
  });

  console.log(result);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
