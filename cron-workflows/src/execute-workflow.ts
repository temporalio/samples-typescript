import { Connection, WorkflowClient } from '@temporalio/client';
import { scheduledWorkflow } from './workflows';

async function run() {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);
  const handle = client.createWorkflowHandle(scheduledWorkflow, {
    taskQueue: 'tutorial',
    cronSchedule: '* * * * *', // start every minute
  });
  await handle.start('Temporal'); // note that we do not block for completion
  console.log(`Cron Workflow ${handle.workflowId} started`); // you can lookup this ID to cancel in future
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
