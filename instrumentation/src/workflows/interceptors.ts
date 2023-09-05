// @@@SNIPSTART typescript-workflow-logging-interceptor
import {
  log,
  Next,
  WorkflowExecuteInput,
  WorkflowInboundCallsInterceptor,
  WorkflowInterceptorsFactory,
} from '@temporalio/workflow';

/** Logs Workflow executions and their duration */
class WorkflowInboundLogInterceptor implements WorkflowInboundCallsInterceptor {
  async execute(input: WorkflowExecuteInput, next: Next<WorkflowInboundCallsInterceptor, 'execute'>): Promise<unknown> {
    let error: any = undefined;
    const startTime = Date.now();
    try {
      return await next(input);
    } catch (err: any) {
      error = err;
      throw err;
    } finally {
      const durationMs = Date.now() - startTime;
      if (error) {
        log.error('workflow failed', { error, durationMs });
      } else {
        log.debug('workflow completed', { durationMs });
      }
    }
  }
}

export const interceptors: WorkflowInterceptorsFactory = () => ({
  inbound: [new WorkflowInboundLogInterceptor()],
});
// @@@SNIPEND
