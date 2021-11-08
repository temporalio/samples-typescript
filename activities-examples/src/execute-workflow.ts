import { WorkflowClient } from '@temporalio/client';
import { httpWorkflow } from './workflows';

async function run(): Promise<void> {
  const client = new WorkflowClient();

  const result = await client.execute(httpWorkflow, { taskQueue: 'activities-examples' });
  console.log(result); // 'The answer is 42'
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
