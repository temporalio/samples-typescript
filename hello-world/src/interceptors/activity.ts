export class ActivityInboundInterceptor implements ActivityInboundCallsInterceptor {
  public readonly metrics: Metrics;
  private readonly activityInfo: Info;

  constructor(ctx: Context, metrics: Metrics) {
    this.activityInfo = ctx.info;
    this.metrics = metrics;
  }

  async execute(
    input: ActivityExecuteInput,
    next: Next<ActivityInboundCallsInterceptor, 'execute'>,
  ): Promise<unknown> {
    let result: unknown;
    let didThrowError = false;
    try {
      result = await next(input);
    } catch (err: any) {
      didThrowError = true;
      this.metrics.increment('activity_failed', 1, {
        activity_type: this.activityInfo.activityType,
        workflow_type: this.activityInfo.workflowType,
        task_queue: this.activityInfo.taskQueue,
      });
      throw err;
    } finally {
      this.metrics.increment(`activity_executed`, 1, {
        activity_type: this.activityInfo.activityType,
        workflow_type: this.activityInfo.workflowType,
        task_queue: this.activityInfo.taskQueue,
        did_fail: `${didThrowError}`,
      });
    }

    return result;
  }
}