import { condition, defineSignal, proxyActivities, setHandler, sleep } from '@temporalio/workflow';
import type * as activities from './activities';

const { greet } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export const proceeder = defineSignal<[string]>('proceed');

export async function versioningExample(): Promise<string> {
  let shouldFinish = false;
  setHandler(proceeder, async (input: string) => {
    await greet('from V1 worker!');
    await sleep('1 second');
    if (input == 'finish') {
      shouldFinish = true;
    }
  });
  await condition(() => shouldFinish);
  return 'Concluded workflow on v1';
}
