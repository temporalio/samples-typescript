export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// OpenRouter's Auto Router picks a concrete model per request. The response's
// `model` field reports which one it chose.
export const DEFAULT_MODEL = 'openrouter/auto';

export const TASK_QUEUE = 'openrouter-prompt-batch';

// Each Activity adds a few events to the Workflow's Event History and each
// answer is stored in the Workflow result payload. Keep batches small enough
// to stay well under the history and payload limits.
export const MAX_PROMPTS_PER_BATCH = 100;

/**
 * One chat completion request. Everything here ends up in the request body,
 * so keep it free of per-attempt values: OpenRouter's response cache keys on
 * the exact body, and a retried attempt should be byte-identical to the first.
 */
export interface OpenRouterRequest {
  prompt: string;
  model: string;
  /** Auto Router cost tier: low, medium, high, xhigh, or max. */
  costTier: 'low' | 'medium' | 'high' | 'xhigh' | 'max';
  /** How long OpenRouter caches a successful response, in seconds. */
  cacheTtlSeconds: number;
  /**
   * Demo hook: fail the first attempt *after* the response arrives, so the
   * retry shows a cache hit billed at $0 in Event History.
   */
  failOnceAfterCall: boolean;
}

export interface OpenRouterResult {
  prompt: string;
  model: string;
  answer: string;
  costUsd: number;
  generationId: string;
  /** "HIT" or "MISS" from X-OpenRouter-Cache-Status, or "" when absent. */
  cacheStatus: string;
}

export interface SkippedPrompt {
  prompt: string;
  reason: string;
}

export interface BatchInput {
  prompts: string[];
  model?: string;
  maxConcurrency?: number;
  failOnceAfterCall?: boolean;
}

export interface BatchResult {
  results: OpenRouterResult[];
  skipped: SkippedPrompt[];
  totalCostUsd: number;
}
