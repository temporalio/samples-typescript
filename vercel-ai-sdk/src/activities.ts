// @@@SNIPSTART typescript-vercel-ai-sdk-weather-activity
type GetWeatherInput = { location: string };
type GetWeatherResult = { city: string; temperatureRange: string; conditions: string };

export async function getWeather(input: GetWeatherInput): Promise<GetWeatherResult> {
  return {
    city: input.location,
    temperatureRange: '14-20C',
    conditions: 'Sunny with wind.',
  };
}
// @@@SNIPEND
