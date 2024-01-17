// @@@SNIPSTART typescript-activity-fake-progress
import { activityInfo, log, sleep, CancelledFailure, heartbeat } from '@temporalio/activity';

export async function fakeProgress(sleepIntervalMs = 1000): Promise<void> {
  try {
    // allow for resuming from heartbeat
    const startingPoint = activityInfo().heartbeatDetails || 1;
    log.info('Starting activity at progress', { startingPoint });
    for (let progress = startingPoint; progress <= 100; ++progress) {
      // simple utility to sleep in activity for given interval or throw if Activity is cancelled
      // don't confuse with Workflow.sleep which is only used in Workflow functions!
      log.info('Progress', { progress });
      await sleep(sleepIntervalMs);
      heartbeat(progress);
    }
  } catch (err) {
    if (err instanceof CancelledFailure) {
      log.warn('Fake progress activity cancelled', { message: err.message });
      // Cleanup
    }
    throw err;
  }
}
// @@@SNIPEND
