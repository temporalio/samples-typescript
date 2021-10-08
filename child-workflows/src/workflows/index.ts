import { createChildWorkflowHandle } from '@temporalio/workflow';

export const childWorkflow = (name: string) => ({
  async execute() {
    return 'i am a child named ' + name;
  },
});

export interface WorkflowExample {
  execute(): Promise<string>;
}

// @@@SNIPSTART nodejs-child-workflow
export function childWorkflowExample(names: string[]): WorkflowExample {
  return {
    async execute() {
      const responseArray = await Promise.all(
        names.map((name) => {
          const child = createChildWorkflowHandle(childWorkflow);
          return child.execute(name);
        })
      );
      return responseArray.join('\n');
    },
  };
}
// @@@SNIPEND
