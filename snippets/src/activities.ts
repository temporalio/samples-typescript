// @@@SNIPSTART typescript-activity-fn
type GreetInput = { name: string };

type GreetResult = { greeting: string };

export async function greet({ name }: GreetInput): Promise<GreetResult> {
  return { greeting: `👋 Hello, ${name}!` };
}
// @@@SNIPEND
