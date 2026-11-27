import { Agent } from '@openai/agents-core';
import { TemporalOpenAIRunner } from '@temporalio/openai-agents/workflow';

type CustomProviderInput = { prompt: string; model?: string };
type CustomProviderResult = { text: string };

export async function customProvider({ prompt, model }: CustomProviderInput): Promise<CustomProviderResult> {
  const agent = new Agent({ name: 'Assistant', instructions: 'You are a helpful assistant.' });
  const result = await new TemporalOpenAIRunner().run(agent, prompt, model ? { runConfig: { model } } : undefined);
  return { text: result.finalOutput ?? '' };
}
