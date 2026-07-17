import { generateText, streamText, streamObject, stepCountIs, tool, wrapLanguageModel } from 'ai';
import type { LanguageModelMiddleware } from 'ai';
import { TemporalMCPClient, TemporalProvider, temporalProvider } from '@temporalio/ai-sdk/workflow';
import { WorkflowStream } from '@temporalio/workflow-streams/workflow';
import type * as activities from './activities';
import { proxyActivities, sleep } from '@temporalio/workflow';
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

  // Briefly hold the run open so a subscriber's final poll can deliver the
  // last deltas before the workflow exits and its in-memory stream log is gone.
  await sleep('500 milliseconds');
  return text;
}
// @@@SNIPEND

// A provider for streaming structured output onto its own topic. `streamObject`
// flows through the same `doStream` path as `streamText`, so no extra wiring is
// needed — only a distinct topic so the two streams stay separable.
export const OBJECT_STREAM_TOPIC = 'object-stream';
const objectStreamingProvider = new TemporalProvider({
  languageModel: { streamingTopic: OBJECT_STREAM_TOPIC },
});

// @@@SNIPSTART typescript-vercel-ai-sdk-stream-object-agent
export async function streamObjectAgent(prompt: string): Promise<string> {
  new WorkflowStream();

  const result = streamObject({
    model: objectStreamingProvider.languageModel('gpt-4o-mini'),
    schema: z.object({
      recipe: z.object({
        name: z.string(),
        ingredients: z.array(z.object({ name: z.string(), amount: z.string() })),
        steps: z.array(z.string()),
      }),
    }),
    prompt,
  });

  // External subscribers see the object build up incrementally via the partial
  // JSON deltas published to OBJECT_STREAM_TOPIC. The workflow drains the
  // partial stream and durably resolves the final, validated object.
  for await (const _partial of result.partialObjectStream) {
    // Draining drives the stream; the consumer renders the live partials.
  }
  const object = await result.object;

  await sleep('500 milliseconds');
  return object.recipe.name;
}
// @@@SNIPEND
