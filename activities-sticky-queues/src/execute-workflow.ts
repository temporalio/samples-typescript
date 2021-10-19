import { Connection, WorkflowClient } from '@temporalio/client';
import { fileProcessingWorkflow } from './workflows';

async function run() {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service, {
    workflowDefaults: {
      taskQueue: 'sticky-activity-tutorial',
    },
  });
  const handle = client.createWorkflowHandle(fileProcessingWorkflow);
  await handle.execute();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
