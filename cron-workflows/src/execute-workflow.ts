import { Connection, WorkflowClient, WorkflowHandle } from '@temporalio/client';
import { scheduledWorkflow } from './workflows';

let handle: WorkflowHandle<(name: string) => Promise<void>>;

async function run() {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);
  handle = client.createWorkflowHandle(scheduledWorkflow, {
    taskQueue: 'tutorial',
    cronSchedule: '* * * * *', // start every minute
  });
  await handle.start('Temporal'); // note that we do not block for completion
  console.log(`Cron Workflow ${handle.workflowId} started`); // you can lookup this ID to cancel in future
  try {
    await handle.result(); // await completion of workflow, which doesn't happen since it is a standard cron workflow
  } catch (err: any) {
    console.error(err.message + ':' + handle.workflowId);
  }
}

// just for this demo - cancel the workflow on Ctrl+C
process.on('SIGINT', () => handle.cancel());
// you cannot catch SIGKILL

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
