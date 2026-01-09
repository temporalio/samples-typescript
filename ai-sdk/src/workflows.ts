import '@temporalio/ai-sdk/lib/load-polyfills';
import { generateText, stepCountIs, tool, wrapLanguageModel } from 'ai';
import { TemporalMCPClient, temporalProvider } from '@temporalio/ai-sdk';
import type * as activities from './activities';
import { proxyActivities } from '@temporalio/workflow';
import z from 'zod';
import { LanguageModelV3Middleware } from '@ai-sdk/provider';

const { getWeather } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

// @@@SNIPSTART typescript-vercel-ai-sdk-haiku-agent
export async function haikuAgent(prompt: string): Promise<string> {
  const result = await generateText({
    model: temporalProvider.languageModel('gpt-4o-mini'),
    prompt,
    system: 'You only respond in haikus.',
  });
  return result.text;
}
// @@@SNIPEND

// @@@SNIPSTART typescript-vercel-ai-sdk-tools-agent
export async function toolsAgent(question: string): Promise<string> {
  const result = await generateText({
    model: temporalProvider.languageModel('gpt-4o-mini'),
    prompt: question,
    system: 'You are a helpful agent.',
    tools: {
      getWeather: tool({
        description: 'Get the weather for a given city',
        inputSchema: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: getWeather,
      }),
    },
    stopWhen: stepCountIs(5),
  });
  return result.text;
}
// @@@SNIPEND

// @@@SNIPSTART typescript-vercel-ai-sdk-middleware-agent
export async function middlewareAgent(prompt: string): Promise<string> {
  const cache = new Map<string, any>();
  const middleware: LanguageModelV3Middleware = {
    specificationVersion: 'v3',
    wrapGenerate: async ({ doGenerate, params }) => {
      const cacheKey = JSON.stringify(params);
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
      }

      const result = await doGenerate();

      cache.set(cacheKey, result);

      return result;
    },
  };

  const model = wrapLanguageModel({
    model: temporalProvider.languageModel('gpt-4o-mini'),
    middleware,
  });

  const result = await generateText({
    model,
    prompt,
    system: 'You only respond in haikus.',
  });
  return result.text;
}

// @@@SNIPSTART typescript-vercel-ai-sdk-mcp-agent
export async function mcpAgent(prompt: string): Promise<string> {
  const mcpClient = new TemporalMCPClient({ name: 'testServer' });
  const tools = await mcpClient.tools();
  const result = await generateText({
    model: temporalProvider.languageModel('gpt-4o-mini'),
    prompt,
    tools,
    system: 'You are a helpful agent, You always use your tools when needed.',
    stopWhen: stepCountIs(5),
  });
  return result.text;
}
// @@@SNIPEND
