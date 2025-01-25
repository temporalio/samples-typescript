// @@@SNIPSTART typescript-sleep-for-days
import { defineSignal, proxyActivities } from '@temporalio/workflow';
import { sleep, setHandler } from '@temporalio/workflow';

import type * as activities from './activities';
import { days } from './helpers';

const { sendEmail } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export const complete = defineSignal('complete');

/** A workflow that repeatedly calls an activity and sleeps, until it receives a signal. */
export async function sleepForDays(numDays: number): Promise<string> {
  let isComplete = false;
  setHandler(complete, () => { isComplete = true });
  
  while (!isComplete) {
    await sendEmail(`Sleeping for ${numDays} days`);
    await sleep(days(numDays));
  }
  return 'done!';
}
// @@@SNIPEND