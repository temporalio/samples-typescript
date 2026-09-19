import { DisposeInput, SignalWorkflowInput } from '@temporalio/workflow';
import {
  ActivityInput,
  ContinueAsNewInput,
  GetLogAttributesInput,
  LocalActivityInput,
  Next,
  QueryInput,
  SignalInput,
  StartChildWorkflowExecutionInput,
  UpdateInput,
  WorkflowExecuteInput,
  WorkflowInboundCallsInterceptor,
  WorkflowInterceptors,
  WorkflowOutboundCallsInterceptor,
  WorkflowInternalsInterceptor,
} from '@temporalio/workflow';
import { GoStyleContext } from '../context-type';
import { extractContextHeader, injectContextHeader, SerializedContext } from './header-injection';

class GoStyleContextWorklfowInterceptor
  implements WorkflowInboundCallsInterceptor, WorkflowOutboundCallsInterceptor, WorkflowInternalsInterceptor
{
  async execute(input: WorkflowExecuteInput, next: Next<WorkflowInboundCallsInterceptor, 'execute'>): Promise<unknown> {
    const inboundContext = extractContextHeader(input.headers);
    const ctx = new WorkflowContext(inboundContext);
    return next({
      ...input,
      args: [ctx, ...input.args],
    });
  }

  async handleSignal(input: SignalInput, next: Next<WorkflowInboundCallsInterceptor, 'handleSignal'>): Promise<void> {
    const inboundContext = extractContextHeader(input.headers);
    const ctx = new WorkflowContext(inboundContext);
    return next({
      ...input,
      args: [ctx, ...input.args],
    });
  }

  async handleQuery(input: QueryInput, next: Next<WorkflowInboundCallsInterceptor, 'handleQuery'>): Promise<unknown> {
    const inboundContext = extractContextHeader(input.headers);
    const ctx = new WorkflowContext(inboundContext);
    return next({
      ...input,
      args: [ctx, ...input.args],
    });
  }

  async handleUpdate(
    input: UpdateInput,
    next: Next<WorkflowInboundCallsInterceptor, 'handleUpdate'>
  ): Promise<unknown> {
    const inboundContext = extractContextHeader(input.headers);
    const ctx = new WorkflowContext(inboundContext);
    return next({
      ...input,
      args: [ctx, ...input.args],
    });
  }

  validateUpdate(input: UpdateInput, next: Next<WorkflowInboundCallsInterceptor, 'validateUpdate'>) {
    const inboundContext = extractContextHeader(input.headers);
    const ctx = new WorkflowContext(inboundContext);
    return next({
      ...input,
      args: [ctx, ...input.args],
    });
  }

  async scheduleActivity(
    input: ActivityInput,
    next: Next<WorkflowOutboundCallsInterceptor, 'scheduleActivity'>
  ): Promise<unknown> {
    const [ctx, ...args] = input.args;
    return await next({
      ...input,
      args,
      headers: injectContextHeader(input.headers, ctx as GoStyleContext),
    });
  }

  async scheduleLocalActivity(
    input: LocalActivityInput,
    next: Next<WorkflowOutboundCallsInterceptor, 'scheduleLocalActivity'>
  ): Promise<unknown> {
    const [ctx, ...args] = input.args;
    return await next({
      ...input,
      args,
      headers: injectContextHeader(input.headers, ctx as GoStyleContext),
    });
  }

  async startChildWorkflowExecution(
    input: StartChildWorkflowExecutionInput,
    next: Next<WorkflowOutboundCallsInterceptor, 'startChildWorkflowExecution'>
  ): Promise<[Promise<string>, Promise<unknown>]> {
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

  async continueAsNew(
    input: ContinueAsNewInput,
    next: Next<WorkflowOutboundCallsInterceptor, 'continueAsNew'>
  ): Promise<never> {
    const [ctx, ...args] = input.args;
    return await next({
      ...input,
      args,
      headers: injectContextHeader(input.headers, ctx as GoStyleContext),
    });
  }

  signalWorkflow(
    input: SignalWorkflowInput,
    next: Next<WorkflowOutboundCallsInterceptor, 'signalWorkflow'>
  ): Promise<void> {
    const [ctx, ...args] = input.args;
    return next({
      ...input,
      args,
      headers: injectContextHeader(input.headers, ctx as GoStyleContext),
    });
  }

  // FIXME: add the context to the log attributes
  getLogAttributes(
    input: GetLogAttributesInput,
    next: Next<WorkflowOutboundCallsInterceptor, 'getLogAttributes'>
  ): Record<string, unknown> {
    return next({
      input,
    });
  }

  // FIXME: This will be required to propagate log attributes
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
  dispose(input: DisposeInput, next: Next<this, 'dispose'>): void {}
}

/**
 * This is the Context implementation you would in your workflow code.
 */
class WorkflowContext implements GoStyleContext {
  public readonly customer?: string;

  constructor(serializedContext: SerializedContext | undefined) {
    this.customer = serializedContext?.customer;
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    console.info(message, metadata);
  }
  warn(message: string, metadata?: Record<string, unknown>): void {
    console.warn(message, metadata);
  }
  error(message: string, metadata?: Record<string, unknown>): void {
    console.error(message, metadata);
  }
  debug(message: string, metadata?: Record<string, unknown>): void {
    console.debug(message, metadata);
  }
}

export const interceptors = (): WorkflowInterceptors => {
  const interceptor = new GoStyleContextWorklfowInterceptor();
  return {
    inbound: [interceptor],
    outbound: [interceptor],
    // internals: [interceptor],
  };
};
