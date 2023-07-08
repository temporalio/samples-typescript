// @@@SNIPSTART typescript-blocked-workflow
import * as wf from '@temporalio/workflow';

export const unblockSignal = wf.defineSignal('unblock');
export const isBlockedQuery = wf.defineQuery<boolean>('isBlocked');

export async function unblockOrCancel(): Promise<void> {
  let isBlocked = true;
  wf.setHandler(unblockSignal, () => void (isBlocked = false));
  wf.setHandler(isBlockedQuery, () => isBlocked);
  wf.log.info('Blocked');
  try {
    await wf.condition(() => !isBlocked);
    wf.log.info('Unblocked');
  } catch (err) {
    if (wf.CancelledFailure.is(err)) {
      wf.log.info('Cancelled');
    }
    throw err;
  }
}
// @@@SNIPEND
