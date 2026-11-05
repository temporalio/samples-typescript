export async function getWeather(args: { city: string }): Promise<string> {
  return `The weather in ${args.city} is warm and sunny, 17 degrees.`;
}
