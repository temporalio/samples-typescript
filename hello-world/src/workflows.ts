// @@@SNIPSTART typescript-hello-workflow
import { condition, sleep, defineSignal, proxyActivities, setHandler } from '@temporalio/workflow';
// Only import the activity types
import type * as activities from './activities';

const { greet } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

const testSignal = defineSignal('test');

/** A workflow that simply calls an activity */
export async function example(name: string): Promise<void> {
  let state = 'WAITING_ON_INPUT';
  setHandler(testSignal, () => {
    state = 'UPDATE';
  });

  const conditionPromise = condition(() => state === 'UPDATE', '10s');
  await sleep('1s');
  await greet(name);
  await conditionPromise;
}
// @@@SNIPEND
