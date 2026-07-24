import * as nexus from 'nexus-rpc';

export interface GetWeatherInput {
  city: string;
}

export interface GetWeatherOutput {
  city: string;
  temperatureC: number;
  conditions: string;
}

export const weatherService = nexus.service('weather', {
  getWeather: nexus.operation<GetWeatherInput, GetWeatherOutput>(),
});
