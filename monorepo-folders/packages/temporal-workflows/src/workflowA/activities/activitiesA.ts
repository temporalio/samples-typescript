import { Context } from '@temporalio/activity';

export async function activityA(name: string): Promise<string> {
  const { log } = Context.current();
  log.info(`hello from activityA ${name}`);
  return `ActivityA result: A-${name}!`;
}
