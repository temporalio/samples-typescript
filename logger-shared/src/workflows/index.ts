import { proxyActivities } from '@temporalio/workflow';
import logger from '../sharedLogger';
import type * as activities from '../activities';

const { greet } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
});

export async function logSampleWorkflow(): Promise<void> {
  const greeting = await greet('Temporal');
  logger.info('Log from Workflow', { greeting });
}
