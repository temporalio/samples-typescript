import {
  CreateScheduleInput,
  CreateScheduleOutput,
  Next,
  ScheduleClientInterceptor,
  WorkflowClientInterceptor,
  WorkflowQueryInput,
  WorkflowSignalInput,
  WorkflowSignalWithStartInput,
  WorkflowStartInput,
  WorkflowStartUpdateInput,
  WorkflowStartUpdateOutput,
} from '@temporalio/client';
import { injectContextHeader } from './context-type';
import { getContext } from './context-injection';

/**
 * Intercepts calls to start a Workflow or a schedule, passing the current
 * context via headers.
 */
export class ContextClientInterceptor implements WorkflowClientInterceptor, ScheduleClientInterceptor {
  public async start(input: WorkflowStartInput, next: Next<WorkflowClientInterceptor, 'start'>): Promise<string> {
    return await next({
      ...input,
      headers: injectContextHeader(input.headers, getContext()),
    });
  }

  public async signal(input: WorkflowSignalInput, next: Next<WorkflowClientInterceptor, 'signal'>): Promise<void> {
    return await next({
      ...input,
      headers: injectContextHeader(input.headers, getContext()),
    });
  }

  public async signalWithStart(
    input: WorkflowSignalWithStartInput,
    next: Next<WorkflowClientInterceptor, 'signalWithStart'>
  ): Promise<string> {
    return await next({
      ...input,
      headers: injectContextHeader(input.headers, getContext()),
    });
  }

  public async startUpdate(
    input: WorkflowStartUpdateInput,
    next: Next<WorkflowClientInterceptor, 'startUpdate'>
  ): Promise<WorkflowStartUpdateOutput> {
    return await next({
      ...input,
      headers: injectContextHeader(input.headers, getContext()),
    });
  }

  public async query(input: WorkflowQueryInput, next: Next<WorkflowClientInterceptor, 'query'>): Promise<unknown> {
    return await next({
      ...input,
      headers: injectContextHeader(input.headers, getContext()),
    });
  }

  // Note that you may also intercept calls to 'cancel', 'terminate', and 'describe'.

  public async create(
    input: CreateScheduleInput,
    next: Next<ScheduleClientInterceptor, 'create'>
  ): Promise<CreateScheduleOutput> {
    return await next({
      ...input,
      options: {
        ...input.options,
        action: {
          ...input.options.action,
        },
      },
      headers: injectContextHeader(input.headers, getContext()),
    });
  }
}
