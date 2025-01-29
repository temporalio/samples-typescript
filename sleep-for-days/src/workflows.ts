// @@@SNIPSTART typescript-sleep-for-days
import { defineSignal, proxyActivities } from '@temporalio/workflow';
import { sleep, setHandler, condition } from '@temporalio/workflow';

import type * as activities from './activities';

const { sendEmail } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export const complete = defineSignal('complete');

/** A workflow that repeatedly calls an activity and sleeps, until it receives a signal. */
export async function sleepForDays(): Promise<string> {
  let isComplete = false;
  setHandler(complete, () => {
    isComplete = true;
  });

  while (!isComplete) {
    await sendEmail(`Sleeping for 30 days`);
    await Promise.race([sleep('30 days'), condition(() => isComplete)]);
  }
  return 'done!';
}
// @@@SNIPEND
