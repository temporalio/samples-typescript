import { condition, defineSignal, proxyActivities, setHandler, log } from '@temporalio/workflow';
import type * as activities from './activities';

const { greet } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export const proceeder = defineSignal<[string]>('proceed');

/**
 * The 1.0 version of the workflow we'll be making changes to
 */
export async function versioningExample(): Promise<string> {
  log.info('Workflow V1 started!', {});
  let shouldFinish = false;
  setHandler(proceeder, async (input: string) => {
    await greet('from V1 worker!');
    if (input == 'finish') {
      shouldFinish = true;
    }
  });
  await condition(() => shouldFinish);
  return 'Concluded workflow on v1';
}
