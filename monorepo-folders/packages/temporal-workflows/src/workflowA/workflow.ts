import { proxyActivities, sleep, log } from '@temporalio/workflow';
// Only import the activity types
import type * as activitiesA from './activities/activitiesA';
import type * as activitiesB from './activities/activitiesB';

const { activityA } = proxyActivities<typeof activitiesA>({
  startToCloseTimeout: '1 minute',
});
const { activityB } = proxyActivities<typeof activitiesB>({
  startToCloseTimeout: '1 minute',
});

type WorkflowAInput = { name: string };
type WorkflowAResult = { message: string };

export async function WorkflowA({ name }: WorkflowAInput): Promise<WorkflowAResult> {
  log.info('Hello from WorkflowA');
  const res1 = await activityA({ name });
  await sleep(100);
  const res2 = await activityB({ name });
  return { message: `A: ${res1.message} | B: ${res2.message}` };
}
