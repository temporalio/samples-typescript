import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from './activities';

const {
  activityB,
  // activityA,
  // activityThatMustRunAfterA,
} = proxyActivities<typeof activities>({
  scheduleToCloseTimeout: '30 seconds',
});

export const workflowId = 'patching-workflows-v3';
// @@@SNIPSTART typescript-patching-3
// v3
import { deprecatePatch } from '@temporalio/workflow';

export async function myWorkflow(): Promise<void> {
  deprecatePatch('my-change-id');
  await activityB();
  await sleep('1 days');
}
// @@@SNIPEND
