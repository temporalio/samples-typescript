type GetWeatherInput = { city: string };
type GetWeatherResult = { forecast: string };

export async function getWeather(args: GetWeatherInput): Promise<GetWeatherResult> {
  return { forecast: `The weather in ${args.city} is warm and sunny, 17 degrees.` };
}
