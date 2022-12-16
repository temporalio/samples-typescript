import { Client } from '@temporalio/client';
import { myWorkflow, workflowId } from './workflows';

async function run(): Promise<void> {
  const client = new Client();
  await client.workflow.start(myWorkflow, { taskQueue: 'patching', workflowId });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
