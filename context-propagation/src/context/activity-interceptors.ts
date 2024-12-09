import { ActivityInterceptors } from '@temporalio/worker';
import { extractContextHeader } from './context-type';
import { withContext, getContext } from './context-injection';

/**
 * Intercepts activity start, to restore the context received through headers.
 * This interceptor also add the content of the context as log metadata.
 */
export function newContextActivityInterceptor(): ActivityInterceptors {
  return {
    inbound: {
      async execute(input, next) {
        const inboundContext = extractContextHeader(input.headers);
        return await withContext(inboundContext ?? {}, () => {
          return next(input);
        });
      },
    },
    outbound: {
      getLogAttributes(input, next) {
        return next({
          input,
          ...getContext(),
        });
      },
    },
  };
}
