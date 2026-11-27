import { log } from '@temporalio/activity';

// @@@SNIPSTART typescript-activity-use-injected-logger
interface GreetInput {
  name: string;
}

export interface GreetResult {
  greeting: string;
}

export async function greet({ name }: GreetInput): Promise<GreetResult> {
  log.info('Log from activity', { name });
  return { greeting: `Hello, ${name}!` };
}
// @@@SNIPEND
