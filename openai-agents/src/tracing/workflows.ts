import { Agent, tool } from '@openai/agents-core';
import { TemporalOpenAIRunner } from '@temporalio/openai-agents/workflow';
import z from 'zod';

type TracedAgentInput = { prompt: string };
type TracedAgentResult = { text: string };

export async function tracedAgent({ prompt }: TracedAgentInput): Promise<TracedAgentResult> {
  const addTool = tool({
    name: 'add',
    description: 'Add two numbers together.',
    parameters: z.object({ a: z.number().describe('First number'), b: z.number().describe('Second number') }),
    execute: async ({ a, b }) => String(a + b),
  });

  const agent = new Agent({
    name: 'TracedAgent',
    instructions: 'You are a math assistant. Use the add tool to compute sums.',
    tools: [addTool],
  });
  const result = await new TemporalOpenAIRunner().run(agent, prompt);
  return { text: result.finalOutput ?? '' };
}
