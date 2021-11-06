export async function activityA(name: string): Promise<string> {
  console.log('hello from A', name);
  return `Hello, ${name}!`;
}
