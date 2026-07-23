import { generateText, streamText, stepCountIs, tool, wrapLanguageModel } from 'ai';
import type { LanguageModelMiddleware } from 'ai';
import { TemporalMCPClient, TemporalProvider, temporalProvider } from '@temporalio/ai-sdk/workflow';
import { WorkflowStream } from '@temporalio/workflow-streams/workflow';
import type * as activities from './activities';
import { proxyActivities, condition, defineSignal, setHandler } from '@temporalio/workflow';
import z from 'zod';

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
  const middleware: LanguageModelMiddleware = {
    specificationVersion: 'v4',
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
// @@@SNIPEND

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

// @@@SNIPSTART typescript-vercel-ai-sdk-streaming-topic
// The topic that streamed model deltas are published to. External consumers
// subscribe to this topic by workflow id to receive live tokens as they are
// generated. See `client.ts` for the consumer side.
export const STREAM_TOPIC = 'text-stream';
// @@@SNIPEND

// @@@SNIPSTART typescript-vercel-ai-sdk-consumer-done-signal
// A subscriber sends this signal once it has received the stream's final delta,
// so the workflow knows it is safe to complete. See `client.ts` for the sender.
export const consumerDoneSignal = defineSignal('consumer-done');
// @@@SNIPEND

// A provider whose language-model calls stream their deltas onto STREAM_TOPIC.
// Setting `streamingTopic` enables `doStream`; without it, streaming calls
// throw. Use a distinct topic per concurrent streaming call.
const streamingProvider = new TemporalProvider({
  languageModel: { streamingTopic: STREAM_TOPIC },
});

// @@@SNIPSTART typescript-vercel-ai-sdk-streaming-agent
export async function streamingAgent(prompt: string): Promise<string> {
  // Host the WorkflowStream as the first statement of the workflow so its
  // publish-signal handler is registered before the streaming activity starts
  // publishing deltas to it.
  new WorkflowStream();

  // A subscriber flips this once it has consumed the final delta (see below).
  let consumerDone = false;
  setHandler(consumerDoneSignal, () => {
    consumerDone = true;
  });

  const result = streamText({
    model: streamingProvider.languageModel('gpt-4o-mini'),
    prompt,
    system: 'You only respond in haikus.',
  });

  // The model call runs in an activity that publishes each delta to
  // STREAM_TOPIC for external subscribers. Inside the workflow the deltas are
  // replayed after the activity completes, so this loop durably reassembles
  // the full text.
  let text = '';
  for await (const delta of result.textStream) {
    text += delta;
  }

  // The workflow's stream log lives in memory and is discarded once the run
  // completes, which can race a subscriber's final poll. Rather than guess at a
  // fixed delay, wait for the subscriber to signal that it received the last
  // delta. The timeout is a fallback for when nothing is subscribed, so the run
  // can't hang forever.
  await condition(() => consumerDone, '10 seconds');
  return text;
}
// @@@SNIPEND
