import OpenAI, { APIError } from 'openai';
import { ApplicationFailure, Context, log } from '@temporalio/activity';
import { OPENROUTER_BASE_URL, OpenRouterRequest, OpenRouterResult } from './shared';

/**
 * OpenAI SDK client pointed at OpenRouter.
 *
 * Client-side retries are disabled so that Temporal owns every retry and each
 * attempt is visible in Event History. (OpenRouter's official `@openrouter/sdk`
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

function retryAfter(headers: Headers | undefined): string | undefined {
  const value = headers?.get('retry-after');
  if (value === null || value === undefined) return undefined;
  const seconds = Number(value);
  // HTTP-date form: let the Activity retry policy decide the delay.
  return Number.isFinite(seconds) ? `${seconds}s` : undefined;
}

/**
 * Turn an OpenRouter error into an ApplicationFailure with the right retry
 * posture. Retryable: 408, 429 (honoring Retry-After), and any 5xx.
 * Non-retryable: other 4xx. 400 is a bad request, 401 a bad key, 402 means
 * the key is out of credits, 403 a moderation or permission block.
 */
export function throwForStatus(status: number, message: string, headers?: Headers): never {
  const retryable = status === 408 || status === 429 || status >= 500;
  throw ApplicationFailure.create({
    message: `OpenRouter returned HTTP ${status}: ${message}`,
    type: errorType(status),
    nonRetryable: !retryable,
    nextRetryDelay: retryable ? retryAfter(headers) : undefined,
    details: [{ status }],
  });
}

function errorMessage(body: unknown): string {
  if (body && typeof body === 'object' && 'error' in body) {
    const error = (body as { error?: { message?: unknown } }).error;
    if (error && typeof error.message === 'string') return error.message;
  }
  return '';
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
        return await send(client, request, context.info.attempt);
      } finally {
        if (heartbeat) clearInterval(heartbeat);
      }
    },
  };
}

async function send(client: OpenAI, request: OpenRouterRequest, attempt: number): Promise<OpenRouterResult> {
  const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming & { plugins?: unknown } = {
    model: request.model,
    messages: [{ role: 'user', content: request.prompt }],
  };
  if (request.model === 'openrouter/auto') {
    params.plugins = [{ id: 'auto-router', cost_tier: request.costTier }];
  }

  let data: OpenAI.Chat.ChatCompletion & { error?: { code?: number; message?: string } };
  let response: Response;
  try {
    ({ data, response } = await client.chat.completions
      .create(params, {
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
    if (e instanceof APIError && typeof e.status === 'number') {
      throwForStatus(e.status, errorMessage(e.error) || e.message, e.headers);
    }
    // Connection errors and timeouts propagate as-is: Temporal retries them.
    throw e;
  }

  if (data.error) {
    // OpenRouter can return HTTP 200 with an error body and no choices when
    // the upstream provider failed after the request was accepted.
    throwForStatus(data.error.code ?? 500, data.error.message ?? '', response.headers);
  }

  const usage = data.usage as (OpenAI.CompletionUsage & { cost?: number }) | undefined;
  const result: OpenRouterResult = {
    prompt: request.prompt,
    model: data.model,
    answer: contentToText(data.choices?.[0]?.message?.content),
    costUsd: typeof usage?.cost === 'number' ? usage.cost : 0,
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
