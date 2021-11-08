import { WorkflowClient } from '@temporalio/client';
import { loopingWorkflow } from './workflows';

async function run() {
  const client = new WorkflowClient();

  const result = await client.execute(loopingWorkflow, { taskQueue: 'continue-as-new' });
  console.log(result); // Hello, Temporal!
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
