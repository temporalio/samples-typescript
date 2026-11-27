import { proxyActivities, sleep, log } from '@temporalio/workflow';
// Only import the activity types
import type * as activities from './activities';

const { activityC, activityD } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

type WorkflowBInput = { name?: string };
type WorkflowBResult = { message: string };

export async function WorkflowB({ name = 'WorkflowB' }: WorkflowBInput = {}): Promise<WorkflowBResult> {
  log.info('Hello from WorkflowB');
  const res1 = await activityC({ name });
  await sleep(100);
  const res2 = await activityD({ name });
  return { message: `${res1.message} ${res2.message}` };
}
