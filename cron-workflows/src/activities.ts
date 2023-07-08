import { Context } from '@temporalio/activity';

export async function logTime(name: string, wfTime: string): Promise<void> {
  const { log } = Context.current();
  const { workflowExecution } = Context.current().info;
  // just demoing usage of Context... you can also pass in the workflowId from the workflow but this is another option
  log.info(`Hello from ${workflowExecution.workflowId}, ${name}!`);
  log.info(`Workflow time: ${wfTime}`);
  log.info(`Activity time: ${Date.now()}`);
}
