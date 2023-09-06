import { ApplicationFailure, log } from '@temporalio/workflow';

export async function example(): Promise<void> {
  const random = Math.random();
  log.info('random', { random });
  if (random > 0.4) {
    log.info('failing workflow run');
    throw new ApplicationFailure('failing workflow run');
  }
}

// @@@SNIPSTART typescript-workflow-type
export async function helloWorld(): Promise<string> {
  return '👋 Hello World!';
}
// @@@SNIPEND
