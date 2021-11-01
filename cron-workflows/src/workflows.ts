import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

const { logTime } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

/** A workflow that simply calls an activity */
export async function scheduledWorkflow(name: string): Promise<void> {
  await logTime(name, '' + Date.now());
}
