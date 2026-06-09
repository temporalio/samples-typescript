import { Context } from '@temporalio/activity';
import { WorkflowStreamClient } from '@temporalio/workflow-streams/client';
import OpenAI from 'openai';
import {
  DEFAULT_LLM_MODEL,
  TOPIC_COMPLETE,
  TOPIC_DELTA,
  TOPIC_RETRY,
  type LLMInput,
  type RetryEvent,
  type TextComplete,
  type TextDelta,
} from './llm-shared';

/**
 * Stream an LLM completion to the parent workflow's stream.
 *
 * Activity-as-publisher: each delta from the OpenAI streaming API is pushed to
 * the workflow's stream as a `TextDelta` event on the `delta` topic. The
 * accumulated full text returns as the activity's result and is also published
 * on the `complete` topic as a terminator. On retry attempts
 * (`Context.current().info.attempt > 1`) a `RetryEvent` lands on the `retry`
 * topic before the new attempt's deltas, so consumers can reset their
 * accumulated state instead of concatenating the failed attempt's partial
 * output with the retried attempt's full output.
 *
 * No `forceFlush: true`: the 200ms `batchInterval` is fast enough for an
 * interactive feel, and the WorkflowStreamClient's asyncDispose flushes
 * cleanly on scope exit.
 */
export async function streamCompletion(input: LLMInput): Promise<string> {
  await using client = WorkflowStreamClient.fromWithinActivity({ batchInterval: '200 milliseconds' });
  // Disable provider-side retries; let Temporal own retry policy at the
  // activity layer.
  const openai = new OpenAI({ maxRetries: 0 });

  const deltas = client.topic<TextDelta>(TOPIC_DELTA);
  const complete = client.topic<TextComplete>(TOPIC_COMPLETE);
  const retry = client.topic<RetryEvent>(TOPIC_RETRY);

  const attempt = Context.current().info.attempt;
  if (attempt > 1) {
    retry.publish({ attempt });
  }

  const full: string[] = [];
  const stream = await openai.chat.completions.create({
    model: input.model ?? DEFAULT_LLM_MODEL,
    messages: [{ role: 'user', content: input.prompt }],
    stream: true,
  });
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content;
    if (!text) continue;
    deltas.publish({ text });
    full.push(text);
  }

  const fullText = full.join('');
  complete.publish({ fullText });
  return fullText;
}
