import { WorkflowClient } from '@temporalio/client';
import { myWorkflow, workflowId } from './workflows';

async function run(): Promise<void> {
  const client = new WorkflowClient();
  await client.start(myWorkflow, { taskQueue: 'patching', workflowId });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
