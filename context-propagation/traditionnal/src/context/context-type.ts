import { Headers, defaultPayloadConverter } from '@temporalio/common';

// Must be JSON serializable
export interface PropagatedContext {
  customer?: string;
}

const CONTEXT_HEADER_NAME = 'Context';

// Headers needs to be converted to payload. By default, we use the default payload converter.
// You may override this if you need to use a custom payload converter.
const payloadConverter = defaultPayloadConverter;

export function injectContextHeader(headers: Headers, context: PropagatedContext | undefined): Headers {
  if (!context) return headers;

  return {
    ...headers,
    [CONTEXT_HEADER_NAME]: payloadConverter.toPayload(context),
  };
}

export function extractContextHeader(headers: Headers): PropagatedContext | undefined {
  const contextHeader = headers[CONTEXT_HEADER_NAME];
  if (!contextHeader) return undefined;
  return payloadConverter.fromPayload(contextHeader) as PropagatedContext;
}
