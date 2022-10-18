import {
  Next,
  proxySinks,
  WorkflowExecuteInput,
  WorkflowInboundCallsInterceptor,
  workflowInfo,
  WorkflowInterceptorsFactory,
} from '@temporalio/workflow';

export const interceptors: WorkflowInterceptorsFactory = () => ({
  inbound: [
    new WorkflowInboundErrorInterceptor(),
    new WorkflowInboundLogInterceptor(),
  ],
});


class WorkflowInboundLogInterceptor implements WorkflowInboundCallsInterceptor {
  async execute(
    input: WorkflowExecuteInput,
    next: Next<WorkflowInboundCallsInterceptor, 'execute'>,
  ): Promise<unknown> {
    const { metrics } = proxySinks<MetricsSinks>();
    let result: unknown;
    let didThrowError = false;
    try {
      result = await next(input);
    } catch (err: any) {
      didThrowError = true;
      throw err;
    } finally {
      metrics.increment(`workflow_executed`, 1, {
        workflow_type: `${workflowInfo().workflowType}`,
        task_queue: `${workflowInfo().taskQueue}`,
        did_fail: `${didThrowError}`,
      });
    }

    return result;
  }
}

class WorkflowInboundErrorInterceptor implements WorkflowInboundCallsInterceptor {
  async execute(
    input: WorkflowExecuteInput,
    next: Next<WorkflowInboundCallsInterceptor, 'execute'>,
  ): Promise<unknown> {
    return await wrapError(() => next(input));
  }

  async handleSignal(
    input: SignalInput,
    next: Next<WorkflowInboundCallsInterceptor, 'handleSignal'>,
  ): Promise<void> {
    return await wrapError(() => next(input));
  }
}

async function wrapError<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const { metrics } = proxySinks<MetricsSinks>();
    metrics.increment(`workflow_failed`, 1, {
      workflow_type: `${workflowInfo().workflowType}`,
      task_queue: `${workflowInfo().taskQueue}`,
    });
  }
}