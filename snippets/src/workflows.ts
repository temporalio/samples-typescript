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
type HelloWorldResult = { greeting: string };

export async function helloWorld(): Promise<HelloWorldResult> {
  return { greeting: '👋 Hello World!' };
}
// @@@SNIPEND
