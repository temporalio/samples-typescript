import { ApplicationFailure } from '@temporalio/activity';

export async function greet(name: string): Promise<string> {
  if (typeof name !== 'string') {
    throw ApplicationFailure.create({ message: 'name must be a string', nonRetryable: true });
  }
  return `Hello, ${name}!`;
}
