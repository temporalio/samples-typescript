// @@@SNIPSTART typescript-encryption-workflow
type ExampleInput = { message: string };
type ExampleResult = { message: string };

export async function example({ message }: ExampleInput): Promise<ExampleResult> {
  return { message: `${message}\nBob: Hi Alice, I'm Workflow Bob.` };
}
// @@@SNIPEND
