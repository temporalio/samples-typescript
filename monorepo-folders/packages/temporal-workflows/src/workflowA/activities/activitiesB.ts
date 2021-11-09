export async function activityB(name: string): Promise<string> {
  console.log('hello from activityB', name);
  return `ActivityB result: B-${name}!`;
}
