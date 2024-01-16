import { log } from '@temporalio/activity';

export async function activityA(): Promise<void> {
  log.info('activityA');
}
export async function activityB(): Promise<void> {
  log.info('activityB');
}
export async function activityThatMustRunAfterA(): Promise<void> {
  log.info('activityThatMustRunAfterA');
}
