// @@@SNIPSTART typescript-strands-tools-activity
type FetchWeatherInput = { city: string };
type FetchWeatherResult = { city: string; temperatureF: number; conditions: string };

export async function fetchWeather(input: FetchWeatherInput): Promise<FetchWeatherResult> {
  return {
    city: input.city,
    temperatureF: 72,
    conditions: 'sunny',
  };
}
// @@@SNIPEND
