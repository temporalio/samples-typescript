export async function getWeather(input: { city: string }): Promise<string> {
  return JSON.stringify({ city: input.city, temperature: '22C', conditions: 'Sunny' });
}

export async function getHeadlines(input: { topic: string }): Promise<string> {
  return JSON.stringify({
    topic: input.topic,
    headlines: [`Breaking: ${input.topic} makes news`, `Update on ${input.topic}`],
  });
}
