import { WorkflowClient, WorkflowHandle } from '@temporalio/client';
import { scheduledWorkflow } from './workflows';

let handle: WorkflowHandle<(name: string) => Promise<void>>;

async function run() {
  const client = new WorkflowClient();

  handle = await client.start(scheduledWorkflow, {
    taskQueue: 'cron-workflows',
    cronSchedule: '* * * * *', // start every minute
    args: ['Temporal'],
  });
  console.log(`Cron started.\nWorkflow ID: ${handle.workflowId}`); // you can lookup this ID to cancel in future

  try {
    await handle.result(); // await completion of Workflow, which doesn't happen since it's a cron Workflow
  } catch (err: any) {
    console.error(err.message + ':' + handle.workflowId);
  }
}

// just for this demo - cancel the workflow on Ctrl+C
process.on('SIGINT', async () => {
  await handle.cancel();
  console.log(`\nCanceled Workflow ${handle.workflowId}`);
  process.exit(0);
});
// you cannot catch SIGKILL

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
