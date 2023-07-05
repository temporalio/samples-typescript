import { condition, defineSignal, log, proxyActivities, setHandler, sleep } from '@temporalio/workflow';
import type * as activities from './activities';

const { greet } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export const proceeder = defineSignal<[string]>('proceed');

/**
 * The 2.0 version of the workflow, which is fully incompatible with the other workflows, since it
 * alters the sequence of commands without using `patched`.
 */
export async function versioningExample(): Promise<string> {
  log.info('Workflow V2.0 started!', {});
  let shouldFinish = false;
  setHandler(proceeder, async (input: string) => {
    await sleep('1 second');
    await greet('from V2 worker!');
    await greet('from V2 worker!');
    if (input == 'finish') {
      shouldFinish = true;
    }
  });
  await condition(() => shouldFinish);
  return 'Concluded workflow on v2';
}
