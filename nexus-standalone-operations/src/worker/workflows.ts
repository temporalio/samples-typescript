import { HelloInput, HelloOutput } from '../api';

export async function helloWorkflow(input: HelloInput): Promise<HelloOutput> {
  return {
    greeting: `Hello, ${input.name}!`,
  };
}
