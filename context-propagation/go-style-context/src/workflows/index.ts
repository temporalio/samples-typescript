import { proxyActivities } from '@temporalio/workflow';
import type { GoStyleContext } from '../context/context-type';
import type * as activities from '../activities';

const { greet } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
});

export async function sampleWorkflow(ctx: GoStyleContext): Promise<void> {
  const greeting = await greet(ctx, 'Temporal');
  ctx.info('Greeted', { greeting });
}
