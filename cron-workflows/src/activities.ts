import { log, activityInfo } from '@temporalio/activity';

interface LogTimeInput {
  name: string;
  wfTime: string;
}

export async function logTime({ name, wfTime }: LogTimeInput): Promise<void> {
  const { workflowExecution } = activityInfo();
  log.info(`Hello from ${workflowExecution?.workflowId}, ${name}!`, { workflowTime: wfTime, activityTime: Date.now() });
}
