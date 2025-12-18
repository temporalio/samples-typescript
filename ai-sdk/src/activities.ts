// @@@SNIPSTART typescript-vercel-ai-sdk-weather-activity
export async function getWeather(input: {
  location: string;
}): Promise<{ city: string; temperatureRange: string; conditions: string }> {
  console.log('Activity execution');
  return {
    city: input.location,
    temperatureRange: '14-20C',
    conditions: 'Sunny with wind.',
  };
}
// @@@SNIPEND