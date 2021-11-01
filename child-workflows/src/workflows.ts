// @@@SNIPSTART typescript-child-workflow
import { executeChild } from '@temporalio/workflow';

export async function parentWorkflow(names: string[]): Promise<string> {
  const responseArray = await Promise.all(
    names.map((name) =>
      executeChild(childWorkflow, {
        args: [name],
        // workflowId, // add business-meaningful workflow id here
        // // regular workflow options apply here, with two additions (defaults shown):
        // cancellationType: ChildWorkflowCancellationType.WAIT_CANCELLATION_COMPLETED,
        // parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_TERMINATE
      })
    )
  );
  return responseArray.join('\n');
}
// @@@SNIPEND

export async function childWorkflow(name: string): Promise<string> {
  return `i am a child named ${name}`;
}
