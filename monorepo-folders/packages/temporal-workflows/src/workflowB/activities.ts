import { Context } from '@temporalio/activity';

export async function activityC(name: string): Promise<string> {
  const { log } = Context.current();
  log.info(`hello from activityC in ${name}`);
  return `ActivityC result: C-${name}!`;
}

export async function activityD(name: string): Promise<string> {
  const { log } = Context.current();
  log.info(`hello from activityD in ${name}`);
  return `ActivityD result: D-${name}!`;
}
