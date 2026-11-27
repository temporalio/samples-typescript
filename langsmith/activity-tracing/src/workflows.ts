import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

const { answer } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

type GreetingWorkflowInput = { prompt: string };

export async function GreetingWorkflow(input: GreetingWorkflowInput): Promise<activities.AnswerResult> {
  return answer(input);
}
