import { log, proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities';

const { greet } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
});

export async function logSampleWorkflow(): Promise<void> {
  const greeting = await greet('Temporal');
  log.info('Greeted', { greeting });
}
