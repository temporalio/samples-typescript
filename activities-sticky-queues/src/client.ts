import { Connection, Client } from '@temporalio/client';
import { fileProcessingWorkflow } from './workflows';

async function run() {
  const connection = await Connection.connect();
  const client = new Client({ connection });
  await client.workflow.execute(fileProcessingWorkflow, {
    taskQueue: 'sticky-activity-tutorial',
    workflowId: 'file-processing-0',
  });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
