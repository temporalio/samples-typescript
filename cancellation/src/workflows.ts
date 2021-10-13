import { createActivityHandle, isCancellation, ActivityCancellationType } from '@temporalio/workflow';
import type * as activities from './activities';

const { fakeProgress } = createActivityHandle<typeof activities>({
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
      console.log('Workflow cancelled along with its activity');
      // To cleanup use CancellationScope.nonCancellable
    }
    throw err;
  }
}
