type GreetInput = { name: string };

export type GreetResult = { greeting: string };

export async function greet({ name }: GreetInput): Promise<GreetResult> {
  return { greeting: `Hello, ${name}!` };
}
