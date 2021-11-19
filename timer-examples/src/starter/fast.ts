import { WorkflowClient } from '@temporalio/client';
import { processOrderWorkflow } from '../workflows';

async function run(): Promise<void> {
  const client = new WorkflowClient();

  // Does *not* send email to `process.env.ADMIN_EMAIL` that order processing is slow
  const result = await client.execute(processOrderWorkflow, {
    taskQueue: 'timer-examples',
    workflowId: 'process-order-slow',
    args: [{ orderProcessingMS: 100, sendDelayedEmailTimeoutMS: 1000 }],
  });

  console.log(result);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
