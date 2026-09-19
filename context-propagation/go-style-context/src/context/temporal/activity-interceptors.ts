import {
  ActivityExecuteInput,
  ActivityInboundCallsInterceptor,
  ActivityInterceptors,
  ActivityOutboundCallsInterceptor,
  GetLogAttributesInput,
  GetMetricTagsInput,
  Next,
} from '@temporalio/worker';
import { log } from '@temporalio/activity';
import { MetricTags } from '@temporalio/common';
import { GoStyleContext } from '../context-type';
import { extractContextHeader, SerializedContext } from './header-injection';

class GoStyleContextActivityInterceptor implements ActivityInboundCallsInterceptor, ActivityOutboundCallsInterceptor {
  async execute(input: ActivityExecuteInput, next: Next<ActivityInboundCallsInterceptor, 'execute'>): Promise<unknown> {
    const inboundContext = extractContextHeader(input.headers);
    const ctx = new ActivityContext(inboundContext);
    return await next({
      ...input,
      args: [ctx, ...input.args],
    });
  }

  // FIXME: add the context to the log attributes
  getLogAttributes(
    input: GetLogAttributesInput,
    next: Next<ActivityOutboundCallsInterceptor, 'getLogAttributes'>
  ): Record<string, unknown> {
    return next({
      input,
    });
  }

  getMetricTags(input: GetMetricTagsInput, next: Next<ActivityOutboundCallsInterceptor, 'getMetricTags'>): MetricTags {
    // FIXME: determine how context needs to affect metric tags
    return next(input);
  }
}

/**
 * Intercepts activity start, to restore the context received through headers.
 * This interceptor also add the content of the context as log metadata.
 */
export function newContextActivityInterceptor(): ActivityInterceptors {
  const interceptor = new GoStyleContextActivityInterceptor();
  return {
    inbound: interceptor,
    outbound: interceptor,
  };
}

/**
 * This is the Context implementation that will be used in Temporal Activity.
 *
 * It is initialized with properties from the serialized context received through headers,
 * and sends logs through the Temporal Activity logger.
 */
class ActivityContext implements GoStyleContext {
  public readonly customer?: string;

  constructor(serializedContext: SerializedContext | undefined) {
    this.customer = serializedContext?.customer;
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    log.info(message, metadata);
  }
  warn(message: string, metadata?: Record<string, unknown>): void {
    log.warn(message, metadata);
  }
  error(message: string, metadata?: Record<string, unknown>): void {
    log.error(message, metadata);
  }
  debug(message: string, metadata?: Record<string, unknown>): void {
    log.debug(message, metadata);
  }
}
