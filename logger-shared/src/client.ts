import { Connection, Client } from '@temporalio/client';
import { logSampleWorkflow } from './workflows';

async function run() {
  const connection = await Connection.connect();
  const client = new Client({
    connection,
  });

  await client.workflow.execute(logSampleWorkflow, {
    taskQueue: 'logger-shared',
    workflowId: 'instrumentation-sample-0',
  });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
