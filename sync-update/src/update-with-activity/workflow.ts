import * as wf from '@temporalio/workflow';

export type RespondActivity = <T = unknown>(result: T) => Promise<void>;

export interface ResponseActivities extends wf.ActivityInterface {
  respond: RespondActivity;
}

export interface ResponseOptions {
  taskQueue: string;
  /**
   * ms formatted string or number of milliseconds
   */
  timeout: string | number;
}

export function createUpdateAndRespondWithActivitySignal<Input>(): wf.SignalDefinition<[Input, ResponseOptions]> {
  return wf.defineSignal<[Input, ResponseOptions]>('updateAndResponsdWithActivity');
}

export interface Task<Input, Output> {
  input: Input;
  respond(output: Output): Promise<void>;
}

export function setUpdateHandler<Input, Output>(): Array<Task<Input, Output>> {
  const tasks = Array<Task<Input, Output>>();
  const def = createUpdateAndRespondWithActivitySignal<Input>();
  wf.setHandler(def, (input, opts) => {
    tasks.push({
      input,
      async respond(output) {
        const { respond } = wf.proxyActivities<ResponseActivities>({
          startToCloseTimeout: '10s',
          scheduleToCloseTimeout: opts.timeout,
          taskQueue: opts.taskQueue,
        });
        await respond(output);
      },
    });
  });
  return tasks;
}
