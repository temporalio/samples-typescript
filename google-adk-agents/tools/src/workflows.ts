import { InMemoryRunner, LlmAgent, isFinalResponse, stringifyContent } from '@google/adk';
import { Type } from '@google/genai';
import { activityAsTool, TemporalModel } from '@temporalio/google-adk-agents';

function weatherTool() {
  return activityAsTool({
    name: 'getWeather',
    description: 'Get the current weather for a city.',
    parameters: {
      type: Type.OBJECT,
      properties: { city: { type: Type.STRING, description: 'The city name' } },
      required: ['city'],
    },
    activity: { startToCloseTimeout: '1 minute' },
  });
}

export async function weatherAgent(prompt: string): Promise<string> {
  const agent = new LlmAgent({
    name: 'weather_agent',
    model: new TemporalModel('gemini-2.5-flash'),
    instruction: 'Use the getWeather tool to answer weather questions.',
    tools: [weatherTool()],
  });

  const runner = new InMemoryRunner({ agent });

  let finalText = '';
  for await (const event of runner.runEphemeral({
    userId: 'user',
    newMessage: { role: 'user', parts: [{ text: prompt }] },
  })) {
    if (isFinalResponse(event)) {
      finalText = stringifyContent(event);
    }
  }
  return finalText;
}

export async function lookupWeather(city: string): Promise<unknown> {
  return weatherTool().runAsync({ args: { city }, toolContext: {} as never });
}
