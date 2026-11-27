type GetWeatherInput = { city: string };
type GetHeadlinesInput = { topic: string };
type GetWeatherResult = { city: string; temperature: string; conditions: string };
type GetHeadlinesResult = { topic: string; headlines: string[] };

export async function getWeather(input: GetWeatherInput): Promise<GetWeatherResult> {
  return { city: input.city, temperature: '22C', conditions: 'Sunny' };
}

export async function getHeadlines(input: GetHeadlinesInput): Promise<GetHeadlinesResult> {
  return {
    topic: input.topic,
    headlines: [`Breaking: ${input.topic} makes news`, `Update on ${input.topic}`],
  };
}
