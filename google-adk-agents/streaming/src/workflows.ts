import type { LlmRequest } from '@google/adk';
import type { Duration } from '@temporalio/common';
import { TemporalModel } from '@temporalio/google-adk-agents';

function makeRequest(text: string): LlmRequest {
  return {
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text }] }],
    config: {},
    toolsDict: {},
    liveConnectConfig: {},
  } as LlmRequest;
}

export async function streamingModelCall(
  prompt: string,
  batchInterval: Duration = '50 milliseconds',
): Promise<{ text: string; chunks: number }> {
  const model = new TemporalModel('gemini-2.5-flash', {
    streamingTopic: 'responses',
    streamingBatchInterval: batchInterval,
    activity: { heartbeatTimeout: '5 seconds' },
  });

  let text = '';
  let chunks = 0;
  for await (const response of model.generateContentAsync(makeRequest(prompt), true)) {
    for (const part of response.content?.parts ?? []) {
      if (part.text) text += part.text;
    }
    chunks++;
  }
  return { text, chunks };
}
