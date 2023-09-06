import { Context } from '@temporalio/activity';

export async function activityA(): Promise<void> {
  const { log } = Context.current();
  log.info('activityA');
}
export async function activityB(): Promise<void> {
  const { log } = Context.current();
  log.info('activityB');
}
export async function activityThatMustRunAfterA(): Promise<void> {
  const { log } = Context.current();
  log.info('activityThatMustRunAfterA');
}
