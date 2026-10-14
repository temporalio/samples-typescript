import {
  ActivityExecuteInput,
  ActivityInboundCallsInterceptor,
  ActivityInterceptors,
  ActivityOutboundCallsInterceptor,
  GetLogAttributesInput,
  GetMetricTagsInput,
  Next,
} from '@temporalio/worker';
import { MetricTags } from '@temporalio/common';
import { extractContextHeader } from './context-type';
import { withContext, getContext } from './context-injection';

class ContextActivityInterceptor implements ActivityInboundCallsInterceptor, ActivityOutboundCallsInterceptor {
  async execute(input: ActivityExecuteInput, next: Next<ActivityInboundCallsInterceptor, 'execute'>): Promise<unknown> {
    const inboundContext = extractContextHeader(input.headers);
    return await withContext(inboundContext ?? {}, () => {
      return next(input);
    });
  }

  getLogAttributes(
    input: GetLogAttributesInput,
    next: Next<ActivityOutboundCallsInterceptor, 'getLogAttributes'>
  ): Record<string, unknown> {
    return next({
      input,
      ...getContext(),
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
  const interceptor = new ContextActivityInterceptor();
  return {
    inbound: interceptor,
    outbound: interceptor,
  };
}
