import { log, activityInfo } from '@temporalio/activity';

export async function logTime(name: string, wfTime: string): Promise<void> {
  const { workflowExecution } = activityInfo();
  log.info(`Hello from ${workflowExecution.workflowId}, ${name}!`, { workflowTime: wfTime, activityTime: Date.now() });
}
