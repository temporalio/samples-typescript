import { tool } from '@strands-agents/sdk';
import { TemporalAgent, workflow as strandsWorkflow } from '@temporalio/strands-agents';
import { z } from 'zod';

const letterCounter = tool({
  name: 'letterCounter',
  description: 'Count how many times `letter` appears in `word` (case-insensitive).',
  inputSchema: z.object({
    word: z.string(),
    letter: z.string(),
  }),
  callback: ({ word, letter }) => word.toLowerCase().split(letter.toLowerCase()).length - 1,
});

export async function toolsWorkflow(prompt: string): Promise<string> {
  const agent = new TemporalAgent({
    activityOptions: { startToCloseTimeout: '60 seconds', retry: { maximumAttempts: 3 } },
    tools: [
      letterCounter,
      strandsWorkflow.activityAsTool('fetchWeather', {
        description: 'Fetch the current weather for a city.',
        inputSchema: {
          type: 'object',
          properties: { city: { type: 'string' } },
          required: ['city'],
        },
        activityOptions: { startToCloseTimeout: '30 seconds', retry: { maximumAttempts: 3 } },
      }),
    ],
  });
  const result = await agent.invoke(prompt);
  return result.toString();
}
