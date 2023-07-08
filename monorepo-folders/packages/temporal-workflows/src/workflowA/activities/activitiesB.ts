import { Context } from '@temporalio/activity';

export async function activityB(name: string): Promise<string> {
  const { log } = Context.current();
  log.info(`hello from activityB ${name}`);
  return `ActivityB result: B-${name}!`;
}
