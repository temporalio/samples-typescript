import { Agent } from '@openai/agents-core';
import { TemporalOpenAIRunner } from '@temporalio/openai-agents/workflow';

export async function customProvider(prompt: string, model?: string): Promise<string> {
  const agent = new Agent({ name: 'Assistant', instructions: 'You are a helpful assistant.' });
  const result = await new TemporalOpenAIRunner().run(agent, prompt, model ? { runConfig: { model } } : undefined);
  return result.finalOutput ?? '';
}
