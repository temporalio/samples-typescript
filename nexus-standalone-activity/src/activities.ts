import { GreetInput, GreetOutput } from './api';

export async function greet(input: GreetInput): Promise<GreetOutput> {
  return {
    message: `Hello, ${input.name}!`,
  };
}
