import { proxyActivities, sleep } from '@temporalio/workflow';
import { WorkflowStream } from '@temporalio/workflow-streams/workflow';
import type * as activities from './llm-activities';
import { type LLMInput } from './llm-shared';

const { streamCompletion } = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
  retry: {
    maximumAttempts: 3,
  },
});

/**
 * Wrapper for an LLM-streaming activity.
 *
 * The workflow does no streaming of its own; it hosts the `WorkflowStream` so
 * external subscribers can attach by workflow id, kicks off the streaming
 * activity, and returns the full text the activity produced.
 *
 * Streaming is delegated to the activity because the OpenAI call is
 * non-deterministic. If the activity fails partway through, Temporal retries
 * it (up to `maximumAttempts`); the retried attempt re-publishes from the
 * start, so the consumer must reset on the activity's retry event. See
 * `llm-activities.ts` and `run-llm.ts`.
 */
export async function llmStreaming(input: LLMInput): Promise<string> {
  // Construct the stream as the first statement of the workflow function so
  // the publish-signal handler is registered before any external publisher
  // (the activity, here) tries to publish.
  new WorkflowStream(input.streamState);

  const result = await streamCompletion(input);
  // Hold the run open briefly so the consumer's next poll delivers the
  // activity's terminal `complete` event before the workflow exits and the
  // in-memory log is gone.
  await sleep('500 milliseconds');
  return result;
}
