import { proxyActivities, sleep } from '@temporalio/workflow';
// Only import the activity types
import type * as activities from './activities';

const { activityC, activityD } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export async function WorkflowB(name = 'WorkflowB'): Promise<string> {
  console.log('Hello from WorkflowB');
  const res1 = await activityC(name);
  await sleep(100);
  const res2 = await activityD(name);
  return `${res1} ${res2}`;
}
