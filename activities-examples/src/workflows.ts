import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

const {
  makeHTTPRequest,
  completeSomethingAsync,
  // cancellableFetch  // todo: demo usage
} = proxyActivities<typeof activities>({
  retry: {
    initialInterval: '50 milliseconds',
    maximumAttempts: 2,
  },
  startToCloseTimeout: '30 seconds',
});

type HttpWorkflowResult = { message: string };
type AsyncActivityWorkflowResult = { message: string };

export async function httpWorkflow(): Promise<HttpWorkflowResult> {
  const { answer } = await makeHTTPRequest();
  return { message: `The answer is ${answer}` };
}

export async function asyncActivityWorkflow(): Promise<AsyncActivityWorkflowResult> {
  const { message } = await completeSomethingAsync();
  return { message: `The Peon says: ${message}` };
}
