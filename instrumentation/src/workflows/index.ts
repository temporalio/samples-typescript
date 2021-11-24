import * as wf from '@temporalio/workflow';
import { logger } from './logger';
import type * as activities from '../activities';

const { greet } = wf.proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
});

export async function logSampleWorkflow(): Promise<void> {
  const greeting = await greet('Temporal');
  logger.info('Greeted', { greeting });
}
