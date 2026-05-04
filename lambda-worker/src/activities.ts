import { log } from '@temporalio/activity';

export async function helloActivity(name: string): Promise<string> {
  log.info('HelloActivity started', { name });
  return `Hello, ${name}!`;
}
