import { Agent, RunContext, tool } from '@openai/agents-core';
import { TemporalOpenAIRunner, activityAsTool } from '@temporalio/openai-agents/workflow';
import { proxyLocalActivities } from '@temporalio/workflow';
import z from 'zod';
import type * as activities from './activities';

const localActivities = proxyLocalActivities<typeof activities>({ startToCloseTimeout: '10 seconds' });

// @@@SNIPSTART typescript-openai-agents-hello-world-workflow
type HelloWorldInput = { prompt: string };
type HelloWorldResult = { text: string };

export async function helloWorld({ prompt }: HelloWorldInput): Promise<HelloWorldResult> {
  const agent = new Agent({ name: 'HelloAgent', instructions: 'You are a helpful assistant.' });
  const result = await new TemporalOpenAIRunner().run(agent, prompt);
  return { text: result.finalOutput ?? '' };
}
// @@@SNIPEND

// @@@SNIPSTART typescript-openai-agents-activity-tool-workflow
type ToolsInput = { prompt: string };
type ToolsResult = { text: string };

export async function tools({ prompt }: ToolsInput): Promise<ToolsResult> {
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
  return { text: result.finalOutput ?? '' };
}
// @@@SNIPEND

// @@@SNIPSTART typescript-openai-agents-inline-tool-workflow
type InlineToolInput = { prompt: string };
type InlineToolResult = { text: string };

export async function inlineTool({ prompt }: InlineToolInput): Promise<InlineToolResult> {
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
  return { text: result.finalOutput ?? '' };
}
// @@@SNIPEND

type LocalActivityToolInput = { prompt: string };
type LocalActivityToolResult = { text: string };

export async function localActivityTool({ prompt }: LocalActivityToolInput): Promise<LocalActivityToolResult> {
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
  return { text: result.finalOutput ?? '' };
}

type AgentContextInput = { prompt: string };
type AgentContextResult = { text: string };

export async function agentContext({ prompt }: AgentContextInput): Promise<AgentContextResult> {
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
  return { text: result.finalOutput ?? '' };
}

const SummarySchema = z.object({
  title: z.string().describe('Short title'),
  summary: z.string().describe('One sentence summary'),
  keywords: z.array(z.string()).describe('Key terms'),
});

type StructuredOutputInput = { prompt: string };
type StructuredOutputResult = z.infer<typeof SummarySchema>;

export async function structuredOutput({ prompt }: StructuredOutputInput): Promise<StructuredOutputResult> {
  const agent = new Agent({
    name: 'SummaryAgent',
    instructions: 'Summarize the provided text as structured JSON matching the output schema.',
    outputType: SummarySchema,
  });
  const result = await new TemporalOpenAIRunner().run(agent, prompt);
  return SummarySchema.parse(result.finalOutput);
}

type ModelOverrideInput = { prompt: string };
type ModelOverrideResult = { text: string };

export async function modelOverride({ prompt }: ModelOverrideInput): Promise<ModelOverrideResult> {
  const agent = new Agent({ name: 'OverrideAgent', instructions: 'You are a helpful assistant.' });
  const result = await new TemporalOpenAIRunner().run(agent, prompt, {
    runConfig: { model: 'gpt-4o-mini' },
  });
  return { text: result.finalOutput ?? '' };
}

type DynamicInstructionsInput = { prompt: string };
type DynamicInstructionsResult = { text: string };

export async function dynamicInstructions({ prompt }: DynamicInstructionsInput): Promise<DynamicInstructionsResult> {
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
  return { text: result.finalOutput ?? '' };
}
