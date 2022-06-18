import { Connection, WorkflowClient } from '@temporalio/client';
import { fileProcessingWorkflow } from './workflows';

async function run() {
  const connection = await Connection.connect();
  const client = new WorkflowClient({ connection });
  await client.execute(fileProcessingWorkflow, {
    taskQueue: 'sticky-activity-tutorial',
    workflowId: 'file-processing-0',
  });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
