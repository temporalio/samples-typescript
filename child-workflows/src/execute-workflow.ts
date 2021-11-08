import { WorkflowClient } from '@temporalio/client';
import { parentWorkflow } from './workflows';

async function run() {
  const client = new WorkflowClient();

  const result = await client.execute(parentWorkflow, {
    taskQueue: 'child-workflows',
    args: ['Alice', 'Bob', 'Charlie'],
  });
  console.log(result);
  // I am a child named Alice
  // I am a child named Bob
  // I am a child named Charlie
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
