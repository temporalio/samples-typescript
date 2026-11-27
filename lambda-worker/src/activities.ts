import { log } from '@temporalio/activity';

type HelloActivityInput = { name: string };

export type HelloActivityResult = { greeting: string };

export async function helloActivity({ name }: HelloActivityInput): Promise<HelloActivityResult> {
  log.info('HelloActivity started', { name });
  return { greeting: `Hello, ${name}!` };
}
