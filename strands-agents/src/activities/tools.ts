// @@@SNIPSTART typescript-strands-tools-activity
export async function fetchWeather(input: { city: string }): Promise<{ city: string; temperatureF: number; conditions: string }> {
  return {
    city: input.city,
    temperatureF: 72,
    conditions: 'sunny',
  };
}
// @@@SNIPEND
