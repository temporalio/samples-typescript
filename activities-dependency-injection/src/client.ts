import { Client } from '@temporalio/client';
import { dependencyWF } from './workflows';

async function run(): Promise<void> {
  const client = new Client();

  const result = await client.workflow.execute(dependencyWF, {
    taskQueue: 'dependency-injection',
    workflowId: 'dependency-injection',
  });
  console.log(result);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
