import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

const { answer } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export async function GreetingWorkflow(prompt: string): Promise<string> {
  return answer(prompt);
}
