import { log } from '@temporalio/activity';

export async function activityA(name: string): Promise<string> {
  log.info('hello from activityA', { name });
  return `ActivityA result: A-${name}!`;
}
