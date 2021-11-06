export async function activityB(name: string): Promise<string> {
  console.log('hello from B', name);
  return `Hello, ${name}!`;
}
