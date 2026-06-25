import { Agent } from '@openai/agents-core';
import { nexusOperationAsTool, TemporalOpenAIRunner } from '@temporalio/openai-agents/workflow';
import { weatherService } from './api';

export const WEATHER_ENDPOINT = 'openai-agents-weather-endpoint';

export async function nexusToolWorkflow(prompt: string): Promise<string> {
  const weatherTool = nexusOperationAsTool(
    weatherService.operations.getWeather,
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
    { service: weatherService, endpoint: WEATHER_ENDPOINT, scheduleToCloseTimeout: '1 minute' },
  );

  const agent = new Agent({
    name: 'WeatherAgent',
    instructions: 'You are a weather assistant. Always use the getWeather tool to answer weather questions.',
    tools: [weatherTool],
  });

  const result = await new TemporalOpenAIRunner().run(agent, prompt);
  return result.finalOutput ?? '';
}
