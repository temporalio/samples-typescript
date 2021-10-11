import { createChildWorkflowHandle } from '@temporalio/workflow';

export const childWorkflow = (name: string) => {
    return 'i am a child named ' + name;
}

// @@@SNIPSTART nodejs-child-workflow
export async function childWorkflowExample(names: string[]) {
  let responseArray = await Promise.all(names.map(name => {
    const child = createChildWorkflowHandle(childWorkflow);
    return child.execute(name);
  }))
  return responseArray.join('\n')
}
// @@@SNIPEND
