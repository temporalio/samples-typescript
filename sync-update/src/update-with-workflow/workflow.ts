import * as wf from '@temporalio/workflow';

export interface ResponseOptions {
  workflowId: string;
}

export function createUpdateAndRespondWithWorkflowSignal<Input>(): wf.SignalDefinition<[Input, ResponseOptions]> {
  return wf.defineSignal<[Input, ResponseOptions]>('updateAndResponsdWithWorkflowSignal');
}

const responseSignal = wf.defineSignal<[unknown]>('response');

export async function proxyWorkflow() {
  return await new Promise((resolve) => wf.setHandler(responseSignal, resolve));
}

export interface Task<Input, Output> {
  input: Input;
  respond(output: Output): Promise<void>;
}

export function setUpdateHandler<Input, Output>(): Array<Task<Input, Output>> {
  const tasks = Array<Task<Input, Output>>();
  const def = createUpdateAndRespondWithWorkflowSignal<Input>();
  wf.setHandler(def, (input, opts) => {
    tasks.push({
      input,
      async respond(output) {
        const handle = wf.getExternalWorkflowHandle(opts.workflowId);
        await handle.signal(responseSignal, output);
      },
    });
  });
  return tasks;
}
