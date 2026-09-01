import { FunctionTool, InMemoryRunner, LlmAgent, isFinalResponse, stringifyContent } from '@google/adk';
import { Type } from '@google/genai';
import { activityAsTool, TemporalModel } from '@temporalio/google-adk-agents/workflow';

export async function weatherAgent(prompt: string): Promise<string> {
  const agent = new LlmAgent({
    name: 'weather_agent',
    model: new TemporalModel('gemini-2.5-flash'),
    instruction: 'Use both tools to convert the reported Celsius temperature and answer the weather question.',
    tools: [
      new FunctionTool({
        name: 'celsiusToFahrenheit',
        description: 'Convert a Celsius temperature to Fahrenheit.',
        parameters: {
          type: Type.OBJECT,
          properties: { celsius: { type: Type.NUMBER } },
          required: ['celsius'],
        },
        execute: (input) => {
          const { celsius } = input as { celsius: number };
          return { fahrenheit: (celsius * 9) / 5 + 32 };
        },
      }),
      activityAsTool({
        name: 'getWeather',
        description: 'Get the current weather for a city.',
        parameters: {
          type: Type.OBJECT,
          properties: { city: { type: Type.STRING, description: 'The city name' } },
          required: ['city'],
        },
      }),
    ],
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
