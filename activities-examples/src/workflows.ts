import { ApplicationFailure, proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';
import { fnThatThrows } from './helpers';

const {
  makeHTTPRequest,
  // cancellableFetch  // todo: demo usage
} = proxyActivities<typeof activities>({
  retry: {
    initialInterval: '50 milliseconds',
    maximumAttempts: 2,
  },
  startToCloseTimeout: '30 seconds',
});

export async function httpWorkflow(): Promise<string> {
  fnThatThrows();
  const answer = await makeHTTPRequest();
  return `The answer is ${answer}`;
}

export async function testWorkflow(): Promise<boolean> {
  try {
    await makeHTTPRequest();
  } catch (e: any) {
    return e.cause instanceof ApplicationFailure;
  }
  throw new Error('Expected ApplicationFailure');
}
