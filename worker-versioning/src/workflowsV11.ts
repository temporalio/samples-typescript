import { condition, defineSignal, proxyActivities, setHandler, log, patched } from '@temporalio/workflow';
import type * as activities from './activities';

const { greet, superGreet } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export const proceeder = defineSignal<[string]>('proceed');

/**
 * The 1.1 version of the workflow, which is compatible with the first version.
 *
 * The compatible changes we've made are:
 *   - Altering the log lines
 *   - Using the `patched` API to properly introduce branching behavior while maintaining
 *     compatibility
 */
export async function versioningExample(): Promise<string> {
  log.info('Workflow V1.1 started!', {});
  let shouldFinish = false;
  setHandler(proceeder, async (input: string) => {
    if (patched('different-activity')) {
      await superGreet({ name: 'from V1.1 worker!', aNumber: 100 });
    } else {
      // Note it is a valid compatible change to alter the input to an activity. However, because
      // we're using the patched API, this branch would only be taken if the workflow was started on
      // a v1 worker.
      await greet('from V1.1 worker!');
    }
    if (input == 'finish') {
      shouldFinish = true;
    }
  });
  await condition(() => shouldFinish);
  return 'Concluded workflow on v1.1';
}
