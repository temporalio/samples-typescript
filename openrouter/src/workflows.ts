import { ActivityFailure, ApplicationFailure, log, proxyActivities } from '@temporalio/workflow';
import type { createActivities } from './activities';
import {
  BatchInput,
  BatchResult,
  DEFAULT_MODEL,
  MAX_PROMPTS_PER_BATCH,
  OpenRouterResult,
  SkippedPrompt,
} from './shared';

// Temporal owns retries: 1s, 2s, 4s, ... capped at 60s, five attempts. The
// Activity marks 4xx errors non-retryable and passes OpenRouter's Retry-After
// through as the next retry delay, so this policy only governs the rest.
const { callOpenRouter } = proxyActivities<ReturnType<typeof createActivities>>({
  startToCloseTimeout: '90 seconds',
  heartbeatTimeout: '10 seconds',
  retry: {
    initialInterval: '1 second',
    backoffCoefficient: 2,
    maximumInterval: '60 seconds',
    maximumAttempts: 5,
  },
});

/** Fan one OpenRouter call out per prompt and collect the answers. */
export async function promptBatch(batch: BatchInput): Promise<BatchResult> {
  if (batch.prompts.length > MAX_PROMPTS_PER_BATCH) {
    throw ApplicationFailure.nonRetryable(
      `Batch has ${batch.prompts.length} prompts; the limit is ${MAX_PROMPTS_PER_BATCH}. ` +
        'Split it, or see the README for the sliding-window pattern.',
    );
  }

  const outcomes: (OpenRouterResult | SkippedPrompt)[] = new Array(batch.prompts.length);
  let next = 0;
  // Bounded concurrency: N runners pull from the shared prompt list.
  const runner = async () => {
    while (next < batch.prompts.length) {
      const index = next++;
      outcomes[index] = await answer(batch.prompts[index], batch);
    }
  };
  await Promise.all(Array.from({ length: batch.maxConcurrency ?? 5 }, runner));

  const results = outcomes.filter((o): o is OpenRouterResult => 'answer' in o);
  const skipped = outcomes.filter((o): o is SkippedPrompt => 'reason' in o);
  return {
    results,
    skipped,
    totalCostUsd: Number(results.reduce((sum, r) => sum + r.costUsd, 0).toFixed(6)),
  };
}

async function answer(prompt: string, batch: BatchInput): Promise<OpenRouterResult | SkippedPrompt> {
  try {
    return await callOpenRouter({
      prompt,
      model: batch.model ?? DEFAULT_MODEL,
      costTier: 'low',
      cacheTtlSeconds: 600,
      failOnceAfterCall: batch.failOnceAfterCall ?? false,
    });
  } catch (e) {
    // One bad prompt should not fail the batch. Record why and carry on; the
    // caller decides what to do with skipped prompts.
    const cause = e instanceof ActivityFailure ? e.cause : e;
    const reason =
      cause instanceof ApplicationFailure && cause.type ? cause.type : ((cause as Error)?.name ?? 'Unknown');
    log.warn('Skipping prompt', { prompt, reason });
    return { prompt, reason };
  }
}
