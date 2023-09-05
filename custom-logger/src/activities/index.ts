import { Context } from '@temporalio/activity';

// @@@SNIPSTART typescript-activity-use-injected-logger
export async function greet(name: string): Promise<string> {
  const { log } = Context.current();
  log.info('Log from activity', { name });
  return `Hello, ${name}!`;
}
// @@@SNIPEND
