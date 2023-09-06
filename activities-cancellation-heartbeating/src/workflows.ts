import { proxyActivities, isCancellation, ActivityCancellationType, log } from '@temporalio/workflow';
import type * as activities from './activities';

const { fakeProgress } = proxyActivities<typeof activities>({
  startToCloseTimeout: '60s',
  heartbeatTimeout: '3s',
  // Don't send rejection to our Workflow until the Activity has confirmed cancellation
  cancellationType: ActivityCancellationType.WAIT_CANCELLATION_COMPLETED,
});

export async function runCancellableActivity(): Promise<void> {
  try {
    await fakeProgress();
  } catch (err) {
    if (isCancellation(err)) {
      log.info('Workflow cancelled along with its activity');
      // To clean up use CancellationScope.nonCancellable
    }
    throw err;
  }
}
