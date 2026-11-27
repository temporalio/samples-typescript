interface GreetInput {
  name: string;
}

interface GreetResult {
  greeting: string;
}

export async function greet({ name }: GreetInput): Promise<GreetResult> {
  return { greeting: `Hello, ${name}!` };
}
