import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

const { logTime } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

/** A workflow that simply calls an activity */
interface ScheduledWorkflowInput {
  name: string;
}

export async function scheduledWorkflow({ name }: ScheduledWorkflowInput): Promise<void> {
  await logTime({ name, wfTime: '' + Date.now() });
}
