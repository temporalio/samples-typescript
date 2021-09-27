// @@@SNIPSTART nodejs-child-workflow
import { createChildWorkflowHandle } from '@temporalio/workflow';
// successString is a workflow implementation like childWorkflowExample below.
// It is called with no arguments and return the string "success".

export const childWorkflow = (name: string) => ({
  async execute() {
    return 'i am a child named ' + name;
  },
})

export interface WorkflowExample {
  execute(): Promise<string>;
}

export function childWorkflowExample(names: string[]): WorkflowExample {
  return {
    async execute() {
      let responseArray = await Promise.all(names.map(name => {
        const child = createChildWorkflowHandle(childWorkflow);
        return child.execute(name)
      }))
      return responseArray.join('\n')
    },
  };
}
// @@@SNIPEND