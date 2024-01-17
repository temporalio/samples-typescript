import { log } from '@temporalio/activity';

export async function activityC(name: string): Promise<string> {
  log.info('hello from activityC', { name });
  return `ActivityC result: C-${name}!`;
}

export async function activityD(name: string): Promise<string> {
  log.info('hello from activityD', { name });
  return `ActivityD result: D-${name}!`;
}
