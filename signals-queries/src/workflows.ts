// @@@SNIPSTART nodejs-blocked-workflow
import * as wf from '@temporalio/workflow';

export const unblockSignal = wf.defineSignal('unblock');
export const isBlockedQuery = wf.defineQuery<boolean>('isBlocked');

export async function unblockOrCancel(): Promise<void> {
  let isBlocked = true;
  wf.setListener(unblockSignal, () => void (isBlocked = false));
  wf.setListener(isBlockedQuery, () => isBlocked);
  console.log('Blocked');
  try {
    await wf.condition(() => !isBlocked);
    console.log('Unblocked');
  } catch (err) {
    if (err instanceof wf.CancelledFailure) {
      console.log('Cancelled');
    }
    throw err;
  }
}
// @@@SNIPEND

