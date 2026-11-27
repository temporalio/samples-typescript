// @@@SNIPSTART typescript-standalone-activity-definition
import { ApplicationFailure } from '@temporalio/activity';

type GreetInput = { name: string };

export type GreetResult = { greeting: string };

export async function greet(input: GreetInput): Promise<GreetResult> {
  const name = input?.name;
  if (typeof name !== 'string') {
    throw ApplicationFailure.create({ message: 'name must be a string', nonRetryable: true });
  }
  return { greeting: `Hello, ${name}!` };
}
// @@@SNIPEND
