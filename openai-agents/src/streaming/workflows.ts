// @@@SNIPSTART typescript-openai-agents-streaming-workflow
import { Agent } from '@openai/agents-core';
import { TemporalOpenAIRunner } from '@temporalio/openai-agents/workflow';
import { WorkflowStream } from '@temporalio/workflow-streams/workflow';
import { condition, defineSignal, setHandler } from '@temporalio/workflow';

export const streamingTopic = 'model-stream';

export const consumerDoneSignal = defineSignal('consumer-done');

export async function streamingChat(prompt: string): Promise<string> {
  new WorkflowStream();

  let consumerDone = false;
  setHandler(consumerDoneSignal, () => {
    consumerDone = true;
  });

  const agent = new Agent({ name: 'StreamingAgent', instructions: 'You are a helpful assistant.' });
  const result = await new TemporalOpenAIRunner().run(agent, prompt, { stream: true });
  // The external client is the event consumer; the Workflow only drives the run to completion.
  for await (const _event of result);
  await result.completed;
  // Completing discards the stream log, racing a subscriber's final poll; the timeout covers no subscriber.
  await condition(() => consumerDone, '10 seconds');
  return result.finalOutput ?? '';
}
// @@@SNIPEND
