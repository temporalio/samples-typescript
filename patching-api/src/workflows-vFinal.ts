import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from './activities';

const {
  activityB,
  // activityA,
  // activityThatMustRunAfterA,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 seconds',
});

export const workflowId = 'patching-workflows-vFinal';
// @@@SNIPSTART typescript-patching-final
// vFinal
export async function myWorkflow(): Promise<void> {
  await activityB();
  await sleep('1 days');
}
// @@@SNIPEND
