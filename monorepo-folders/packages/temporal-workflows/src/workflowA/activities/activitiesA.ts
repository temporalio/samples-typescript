export async function activityA(name: string): Promise<string> {
  console.log('hello from activityA', name);
  return `ActivityA result: A-${name}!`;
}
