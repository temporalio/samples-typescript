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
import { GoStyleContext } from '../context-type';
import { injectContextHeader } from './header-injection';

/**
 * Intercepts calls to start a Workflow or a schedule, passing the current
 * context via headers.
 */
export class ContextClientInterceptor implements WorkflowClientInterceptor, ScheduleClientInterceptor {
  public async start(input: WorkflowStartInput, next: Next<WorkflowClientInterceptor, 'start'>): Promise<string> {
    const [ctx, ...args] = input.options.args;
    return await next({
      ...input,
      options: {
        ...input.options,
        args,
      },
      headers: injectContextHeader(input.headers, ctx as GoStyleContext),
    });
  }

  public async signal(input: WorkflowSignalInput, next: Next<WorkflowClientInterceptor, 'signal'>): Promise<void> {
    const [ctx, ...args] = input.args;
    return await next({
      ...input,
      args,
      headers: injectContextHeader(input.headers, ctx as GoStyleContext),
    });
  }

  public async signalWithStart(
    input: WorkflowSignalWithStartInput,
    next: Next<WorkflowClientInterceptor, 'signalWithStart'>
  ): Promise<string> {
    const [ctx, ...args] = input.options.args;
    return await next({
      ...input,
      options: {
        ...input.options,
        args,
      },
      headers: injectContextHeader(input.headers, ctx as GoStyleContext),
    });
  }

  public async startUpdate(
    input: WorkflowStartUpdateInput,
    next: Next<WorkflowClientInterceptor, 'startUpdate'>
  ): Promise<WorkflowStartUpdateOutput> {
    const [ctx, ...args] = input.args;
    return await next({
      ...input,
      args,
      headers: injectContextHeader(input.headers, ctx as GoStyleContext),
    });
  }

  public async query(input: WorkflowQueryInput, next: Next<WorkflowClientInterceptor, 'query'>): Promise<unknown> {
    const [ctx, ...args] = input.args;
    return await next({
      ...input,
      args,
      headers: injectContextHeader(input.headers, ctx as GoStyleContext),
    });
  }

  public async create(
    input: CreateScheduleInput,
    next: Next<ScheduleClientInterceptor, 'create'>
  ): Promise<CreateScheduleOutput> {
    const [ctx, ...args] = input.options.action.args;
    return await next({
      ...input,
      options: {
        ...input.options,
        action: {
          ...input.options.action,
          args,
        },
      },
      headers: injectContextHeader(input.headers, ctx as GoStyleContext),
    });
  }
}
