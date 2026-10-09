import OpenAI, { APIError } from 'openai';
import { ApplicationFailure, Context, log } from '@temporalio/activity';
import { OPENROUTER_BASE_URL, OpenRouterRequest, OpenRouterResult } from './shared';

/**
 * OpenAI SDK client pointed at OpenRouter.
 *
 * Client-side retries are disabled so that Temporal owns every retry: the
 * attempt count and last failure land in Event History, and each attempt is
 * logged below. (OpenRouter's official `@openrouter/sdk`
 * retries 5xx and connection errors for up to an hour by default; if you use it
 * instead, pass `retryConfig: { strategy: 'none' }`.)
 */
export function buildClient(apiKey = process.env.OPENROUTER_API_KEY): OpenAI {
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is required');
  }
  const defaultHeaders: Record<string, string> = {};
  // App attribution is optional. When set, OpenRouter lists your app in its
  // public rankings; add X-OpenRouter-App-Visibility: hidden to opt out.
  if (process.env.OPENROUTER_HTTP_REFERER) {
    defaultHeaders['HTTP-Referer'] = process.env.OPENROUTER_HTTP_REFERER;
  }
  if (process.env.OPENROUTER_APP_TITLE) {
    defaultHeaders['X-OpenRouter-Title'] = process.env.OPENROUTER_APP_TITLE;
  }
  return new OpenAI({
    baseURL: OPENROUTER_BASE_URL,
    apiKey,
    maxRetries: 0,
    timeout: 60_000,
    defaultHeaders,
  });
}

/** Error type recorded in Event History for an OpenRouter HTTP status. */
export function errorType(status: number): string {
  return `OpenRouterHTTP${status}`;
}

/**
 * Thrown instead of an HTTP status type when the call failed for lack of
 * money: a 402 (account or API key out of credits; `error.metadata.limit_source`
 * says which) or, as observed in practice, a 403 "Key limit exceeded" for a
 * per-key limit. A Workflow can pause on this and resume once someone tops up.
 */
export const OUT_OF_CREDITS = 'OpenRouterOutOfCredits';

/** Longest Retry-After the Activity passes through as the next retry delay. */
const MAX_RETRY_AFTER_SECONDS = 300;

/** Parse Retry-After in either its delta-seconds or HTTP-date form. */
function retryAfter(headers: Headers | undefined): string | undefined {
  const value = headers?.get('retry-after')?.trim();
  if (!value) return undefined;
  let seconds = Number(value);
  if (!Number.isFinite(seconds)) {
    const delayMs = Date.parse(value) - Date.now();
    if (!Number.isFinite(delayMs)) return undefined;
    seconds = Math.ceil(delayMs / 1000);
  }
  if (seconds <= 0) return undefined;
  // Honor the server, within reason: nextRetryDelay overrides the retry
  // policy's interval, so cap it rather than park a prompt for hours.
  return `${Math.min(seconds, MAX_RETRY_AFTER_SECONDS)}s`;
}

/** The `error` object OpenRouter returns, as far as this sample reads it. */
interface OpenRouterErrorBody {
  code?: number;
  message?: string;
  metadata?: { limit_source?: string };
}

function errorBody(body: unknown): OpenRouterErrorBody {
  if (!body || typeof body !== 'object') return {};
  // openai's APIError.error is already the inner `error` object; a raw
  // response body wraps it as `{ error: {...} }`. Accept both.
  const inner = 'error' in body ? (body as { error: unknown }).error : body;
  return inner && typeof inner === 'object' ? (inner as OpenRouterErrorBody) : {};
}

/**
 * Turn an OpenRouter error into an ApplicationFailure with the right retry
 * posture. Retryable: 408, 429 (honoring Retry-After), any 5xx, and the
 * transient in-flight-budget 402. Non-retryable: other 4xx. 400 is a bad
 * request, 401 a bad key, 403 a moderation or permission block. Out of money
 * is its own type (OUT_OF_CREDITS).
 */
export function throwForStatus(status: number, error: OpenRouterErrorBody, headers?: Headers): never {
  const message = error.message ?? '';
  // A 402 from the in-flight budget cap is transient: OpenRouter asks you to
  // wait for Retry-After and try again. Every other 402, and the legacy 403
  // "Key limit exceeded", means someone has to add credits.
  const transient402 = status === 402 && error.metadata?.limit_source === 'openrouter_in_flight_budget';
  if (!transient402 && (status === 402 || (status === 403 && message.toLowerCase().includes('limit exceeded')))) {
    throw ApplicationFailure.create({
      message: `OpenRouter returned HTTP ${status}: ${message}`,
      type: OUT_OF_CREDITS,
      nonRetryable: true,
      details: [{ status }],
    });
  }
  const retryable = transient402 || status === 408 || status === 429 || status >= 500;
  throw ApplicationFailure.create({
    message: `OpenRouter returned HTTP ${status}: ${message}`,
    type: errorType(status),
    nonRetryable: !retryable,
    nextRetryDelay: retryable ? retryAfter(headers) : undefined,
    details: [{ status }],
  });
}

function contentToText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .flatMap((part) => (part && typeof part === 'object' && typeof part.text === 'string' ? [part.text] : []))
    .join('\n');
}

export function createActivities(client: OpenAI) {
  return {
    /** One chat completion. One HTTP call per attempt; Temporal retries. */
    async callOpenRouter(request: OpenRouterRequest): Promise<OpenRouterResult> {
      const context = Context.current();
      // Heartbeat so a killed Worker is noticed after heartbeatTimeout rather
      // than after the full startToCloseTimeout.
      const heartbeatMs = context.info.heartbeatTimeoutMs;
      const heartbeat = heartbeatMs
        ? setInterval(() => context.heartbeat(context.info.attempt), heartbeatMs / 2)
        : undefined;
      try {
        return await send(client, request, context);
      } finally {
        if (heartbeat) clearInterval(heartbeat);
      }
    },
  };
}

async function send(client: OpenAI, request: OpenRouterRequest, context: Context): Promise<OpenRouterResult> {
  const attempt = context.info.attempt;
  const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming & { plugins?: unknown } = {
    model: request.model,
    messages: [{ role: 'user', content: request.prompt }],
  };
  if (request.model === 'openrouter/auto') {
    params.plugins = [{ id: 'auto-router', cost_tier: request.costTier }];
  }

  let data: OpenAI.Chat.ChatCompletion & { error?: OpenRouterErrorBody };
  let response: Response;
  try {
    ({ data, response } = await client.chat.completions
      .create(params, {
        // Abort the HTTP request if the Activity is cancelled.
        signal: context.cancellationSignal,
        headers: {
          // Ask OpenRouter to cache the successful response. A retry of the
          // byte-identical request within the TTL is served from cache and
          // billed at $0.
          'X-OpenRouter-Cache': 'true',
          'X-OpenRouter-Cache-TTL': String(request.cacheTtlSeconds),
        },
      })
      .withResponse());
  } catch (e) {
    if (context.cancellationSignal.aborted) {
      // Whatever the request did, the Activity was cancelled; surface that as
      // a cancellation, not as a failed call. Rejects with CancelledFailure.
      await context.cancelled;
    }
    if (e instanceof APIError && typeof e.status === 'number') {
      const error = errorBody(e.error);
      throwForStatus(e.status, { ...error, message: error.message ?? e.message }, e.headers);
    }
    // Connection errors and timeouts propagate as-is: Temporal retries them.
    throw e;
  }

  if (data.error) {
    // OpenRouter can return HTTP 200 with an error body and no choices when
    // the upstream provider failed after the request was accepted.
    const error = errorBody(data);
    throwForStatus(typeof error.code === 'number' ? error.code : 500, error, response.headers);
  }
  const choiceError = (data.choices?.[0] as { error?: OpenRouterErrorBody } | undefined)?.error;
  if (choiceError) {
    // Or a 200 with a partial answer and the provider's error on the choice
    // itself; a partial answer is not an answer.
    throwForStatus(typeof choiceError.code === 'number' ? choiceError.code : 500, choiceError, response.headers);
  }
  if (!data.choices?.length) {
    // No error and no answer: treat like a server error and retry.
    throwForStatus(500, { message: 'Response has no choices' }, response.headers);
  }

  const usage = data.usage as (OpenAI.CompletionUsage & { cost?: number }) | undefined;
  if (typeof usage?.cost !== 'number') {
    // OpenRouter reports cost on every response; if it is ever missing, say
    // so rather than pretending the call was free.
    log.warn('OpenRouter response has no usage.cost');
  }
  const result: OpenRouterResult = {
    prompt: request.prompt,
    model: data.model,
    answer: contentToText(data.choices?.[0]?.message?.content),
    costUsd: typeof usage?.cost === 'number' ? usage.cost : null,
    generationId: data.id,
    cacheStatus: response.headers.get('x-openrouter-cache-status') ?? '',
  };
  log.info('OpenRouter call completed', {
    attempt,
    model: result.model,
    costUsd: result.costUsd,
    cacheStatus: result.cacheStatus,
    generationId: result.generationId,
  });
  if (request.failOnceAfterCall && attempt === 1) {
    // Demo hook: the Worker "crashes" after the response arrived. The retry
    // re-sends the identical request and gets a cache hit.
    throw ApplicationFailure.create({
      message: 'Simulated failure after the response was received',
      type: 'SimulatedFailure',
    });
  }
  return result;
}
