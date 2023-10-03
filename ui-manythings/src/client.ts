import { Client } from '@temporalio/client';
import { parentWorkflow } from './workflows';

async function run() {
  const client = new Client();

  const result = await client.workflow.execute(parentWorkflow, {
    taskQueue: 'child-workflows',
    workflowId: 'parent-sample-0',
  });
  console.log(result);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
