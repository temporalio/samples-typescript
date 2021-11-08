import { WorkflowClient } from '@temporalio/client';
import { dependencyWF } from './workflows';

async function run(): Promise<void> {
  const client = new WorkflowClient();

  const result = await client.execute(dependencyWF, { taskQueue: 'dependency-injection' });
  console.log(result);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
