import * as nexus from 'nexus-rpc';
import { weatherService, GetWeatherInput, GetWeatherOutput } from './api';

const WEATHER: Record<string, Omit<GetWeatherOutput, 'city'>> = {
  tokyo: { temperatureC: 22, conditions: 'Sunny' },
  london: { temperatureC: 14, conditions: 'Cloudy' },
  cairo: { temperatureC: 33, conditions: 'Clear' },
};

export const weatherServiceHandler = nexus.serviceHandler(weatherService, {
  getWeather: async (_ctx, input: GetWeatherInput): Promise<GetWeatherOutput> => {
    const found = WEATHER[input.city.toLowerCase()] ?? { temperatureC: 20, conditions: 'Unknown' };
    return { city: input.city, ...found };
  },
});
