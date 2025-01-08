import { log, patched, proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from '../activities';

const { greet } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
});

export async function logSampleWorkflow(): Promise<void> {
  log.info('Logging from a workflow');
  patched('1234');      // To make this workflow fail with non-determinism, kill
  await sleep('10s');   // the worker during this 10 seconds sleep, then change
                        // the 'patched(...)' string, and restart the worker.

  const greeting = await greet('Temporal');
  log.info('Greeted', { greeting });
}
