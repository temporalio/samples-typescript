import { CancelledFailure } from '@temporalio/common';
import { Context } from '@temporalio/activity';

export async function activityToBeCancelled() {
  const sleepIntervalMs = 100;

  try {
    for (let progress = 1; progress <= 100; ++progress) {
      // sleep for given interval or throw if Activity is cancelled
      await Context.current().sleep(sleepIntervalMs);
      Context.current().heartbeat(progress);
    }
  } catch (err) {
    if (err instanceof CancelledFailure) {
      return { ok: 1 };
    }
    throw err;
  }

  return { ok: 1 };
}