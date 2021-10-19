import { Context } from '@temporalio/activity'

export async function logTime(name: string, wfTime: string): Promise<void> {
  const { workflowExecution } = Context.current().info 
  // just demoing usage of Context... you can also pass in the workflowId from the workflow but this is another option
  console.log(`Hello from ${workflowExecution.workflowId}, ${name}!`);
  console.log(`Workflow time: `, wfTime);
  console.log(`Activity time: ` + Date.now());
}