// Add Activity Definitions here.
type YourActivityInput = { name: string };

type YourActivityResult = { greeting: string };

export async function YOUR_ACTIVITY({ name }: YourActivityInput): Promise<YourActivityResult> {
  return { greeting: `Hello, ${name}!` };
}
