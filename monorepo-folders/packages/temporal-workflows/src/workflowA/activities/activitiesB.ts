import { log } from '@temporalio/activity';

export async function activityB(name: string): Promise<string> {
  log.info('hello from activityB', { name });
  return `ActivityB result: B-${name}!`;
}
