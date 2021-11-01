import { Connection, WorkflowClient } from '@temporalio/client';
import { fileProcessingWorkflow } from './workflows';

async function run() {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service, {
    workflowDefaults: {
      taskQueue: 'sticky-activity-tutorial',
    },
  });
  await client.execute(fileProcessingWorkflow);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
