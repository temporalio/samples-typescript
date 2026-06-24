import type { LlmRequest } from '@google/adk';
import { TemporalModel } from '@temporalio/google-adk-agents/workflow';
import { condition, defineSignal, setHandler } from '@temporalio/workflow';
import { WorkflowStream } from '@temporalio/workflow-streams/workflow';

export const streamingTopic = 'responses';

export const consumerDoneSignal = defineSignal('consumer-done');

export async function streamingModelCall(prompt: string): Promise<{ text: string; chunks: number }> {
  new WorkflowStream();

  let consumerDone = false;
  setHandler(consumerDoneSignal, () => {
    consumerDone = true;
  });

  const model = new TemporalModel('gemini-2.5-flash', {
    streamingTopic,
    activity: { heartbeatTimeout: '5 seconds' },
  });

  const request = {
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {},
    toolsDict: {},
    liveConnectConfig: {},
  } as LlmRequest;

  let text = '';
  let chunks = 0;
  // The turn's whole text is on the last, non-partial response; the deltas would double it.
  for await (const response of model.generateContentAsync(request, true)) {
    if (response.partial === true) {
      chunks++;
      continue;
    }
    text = (response.content?.parts ?? []).map((part) => part.text ?? '').join('');
  }
  // Completing discards the stream log, racing a subscriber's final poll; the timeout covers no subscriber.
  await condition(() => consumerDone, '10 seconds');
  return { text, chunks };
}
