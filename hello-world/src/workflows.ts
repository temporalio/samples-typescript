// @@@SNIPSTART typescript-hello-workflow
import { sleep, proxyActivities } from '@temporalio/workflow';
// Only import the activity types
import type * as activities from './activities';

const { greet } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

/** A workflow that simply calls an activity */
export async function example(name: string): Promise<string> {
  const minuteP = sleep('1m');
  await sleep('5s');
  const s = await greet(name);
  await sleep('20s');
  await minuteP;
  return s;
}
// @@@SNIPEND
