import { Agent } from '@openai/agents-core';
import { TemporalOpenAIRunner } from '@temporalio/openai-agents/workflow';
import { WorkflowStream } from '@temporalio/workflow-streams/workflow';

export const streamingTopic = 'model-stream';

// @@@SNIPSTART typescript-openai-agents-streaming-workflow
export async function streamingChat(prompt: string): Promise<string> {
  new WorkflowStream();
  const agent = new Agent({ name: 'StreamingAgent', instructions: 'You are a helpful assistant.' });
  const result = await new TemporalOpenAIRunner().run(agent, prompt, { stream: true });
  // The external client is the event consumer; the Workflow only drives the run to completion.
  for await (const _event of result);
  await result.completed;
  return result.finalOutput ?? '';
}
// @@@SNIPEND
