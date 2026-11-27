// @@@SNIPSTART typescript-child-workflow
import { executeChild } from '@temporalio/workflow';

interface ParentWorkflowInput {
  names: string[];
}

interface ParentWorkflowResult {
  messages: string[];
}

export async function parentWorkflow({ names }: ParentWorkflowInput): Promise<ParentWorkflowResult> {
  const responseArray = await Promise.all(
    names.map((name) =>
      executeChild(childWorkflow, {
        args: [{ name }],
        // workflowId, // add business-meaningful workflow id here
        // // regular workflow options apply here, with two additions (defaults shown):
        // cancellationType: ChildWorkflowCancellationType.WAIT_CANCELLATION_COMPLETED,
        // parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_TERMINATE
      }),
    ),
  );
  return { messages: responseArray.map(({ message }) => message) };
}
// @@@SNIPEND

interface ChildWorkflowInput {
  name: string;
}

interface ChildWorkflowResult {
  message: string;
}

export async function childWorkflow({ name }: ChildWorkflowInput): Promise<ChildWorkflowResult> {
  return { message: `I am a child named ${name}` };
}
