import { Agent, RunContext, tool } from '@openai/agents-core';
import { TemporalOpenAIRunner, activityAsTool } from '@temporalio/openai-agents/workflow';
import { proxyLocalActivities } from '@temporalio/workflow';
import z from 'zod';
import type * as activities from './activities';

const localActivities = proxyLocalActivities<typeof activities>({ startToCloseTimeout: '10 seconds' });

export async function helloWorld(prompt: string): Promise<string> {
  const agent = new Agent({ name: 'HelloAgent', instructions: 'You are a helpful assistant.' });
  const result = await new TemporalOpenAIRunner().run(agent, prompt);
  return result.finalOutput ?? '';
}

export async function tools(prompt: string): Promise<string> {
  const weatherTool = activityAsTool<typeof activities.getWeather>(
    {
      name: 'getWeather',
      description: 'Get the current weather for a city.',
      parameters: {
        type: 'object',
        properties: { city: { type: 'string', description: 'The city name' } },
        required: ['city'],
        additionalProperties: false,
      },
    },
    { startToCloseTimeout: '1 minute' },
  );

  const agent = new Agent({
    name: 'WeatherAgent',
    instructions: 'You are a helpful weather assistant. Always use the getWeather tool to answer weather questions.',
    tools: [weatherTool],
  });
  const result = await new TemporalOpenAIRunner().run(agent, prompt);
  return result.finalOutput ?? '';
}

export async function inlineTool(prompt: string): Promise<string> {
  const addTool = tool({
    name: 'add',
    description: 'Add two numbers together.',
    parameters: z.object({ a: z.number().describe('First number'), b: z.number().describe('Second number') }),
    execute: async ({ a, b }) => String(a + b),
  });

  const agent = new Agent({
    name: 'MathAgent',
    instructions: 'You are a math assistant. Use the add tool to compute sums.',
    tools: [addTool],
  });
  const result = await new TemporalOpenAIRunner().run(agent, prompt);
  return result.finalOutput ?? '';
}

export async function localActivityTool(prompt: string): Promise<string> {
  const headlinesTool = tool({
    name: 'getHeadlines',
    description: 'Get the latest headlines for a topic.',
    parameters: z.object({ topic: z.string().describe('The topic to get headlines for') }),
    execute: async ({ topic }) => localActivities.getHeadlines({ topic }),
  });

  const agent = new Agent({
    name: 'NewsAgent',
    instructions: 'You are a news assistant. Use the getHeadlines tool to fetch headlines.',
    tools: [headlinesTool],
  });
  const result = await new TemporalOpenAIRunner().run(agent, prompt);
  return result.finalOutput ?? '';
}

export async function agentContext(prompt: string): Promise<string> {
  interface AppContext {
    userId: string;
  }

  const whoAmITool = tool({
    name: 'whoAmI',
    description: 'Returns the current user ID from context.',
    parameters: z.object({}),
    execute: async (_args, runCtx?: RunContext<AppContext>) => runCtx?.context.userId ?? 'unknown',
  });

  const agent = new Agent<AppContext>({
    name: 'ContextAgent',
    instructions: 'You are a helpful assistant. Use the whoAmI tool to identify the user.',
    tools: [whoAmITool],
  });

  const result = await new TemporalOpenAIRunner().run(agent, prompt, { context: { userId: 'user-42' } });
  return result.finalOutput ?? '';
}

const SummarySchema = z.object({
  title: z.string().describe('Short title'),
  summary: z.string().describe('One sentence summary'),
  keywords: z.array(z.string()).describe('Key terms'),
});

export async function structuredOutput(prompt: string): Promise<string> {
  const agent = new Agent({
    name: 'SummaryAgent',
    instructions: 'Summarize the provided text as structured JSON matching the output schema.',
    outputType: SummarySchema,
  });
  const result = await new TemporalOpenAIRunner().run(agent, prompt);
  return JSON.stringify(result.finalOutput);
}

export async function modelOverride(prompt: string): Promise<string> {
  const agent = new Agent({ name: 'OverrideAgent', instructions: 'You are a helpful assistant.' });
  const result = await new TemporalOpenAIRunner().run(agent, prompt, {
    runConfig: { model: 'gpt-4o-mini' },
  });
  return result.finalOutput ?? '';
}

export async function dynamicInstructions(prompt: string): Promise<string> {
  interface UserContext {
    userName: string;
    style: string;
  }

  const agent = new Agent<UserContext>({
    name: 'DynamicAgent',
    instructions: (runContext: RunContext<UserContext>, _agent: Agent<UserContext>) =>
      `You are a helpful assistant. Address the user as ${runContext.context.userName} and respond in a ${runContext.context.style} style.`,
  });

  const result = await new TemporalOpenAIRunner().run(agent, prompt, {
    context: { userName: 'Ada', style: 'concise' },
  });
  return result.finalOutput ?? '';
}
