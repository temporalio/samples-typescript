// Add Workflow Definitions here.
type YourWorkflowInput = { name: string };

type YourWorkflowResult = { greeting: string };

export async function YOUR_WORKFLOW({ name }: YourWorkflowInput): Promise<YourWorkflowResult> {
  // Your workflow code here
  return { greeting: `Hello, ${name}!` };
}
