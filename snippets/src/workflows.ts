import { ApplicationFailure, proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

const { greet } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export async function example(): Promise<void> {
  const random = Math.random();
  console.log('random:', random);
  if (random > 0.4) {
    console.log('failing workflow run');
    throw new ApplicationFailure('failing workflow run');
  }
}

// @@@SNIPSTART typescript-workflow-type
export async function helloWorld(): Promise<string> {
  return '👋 Hello World!';
}
// @@@SNIPEND
