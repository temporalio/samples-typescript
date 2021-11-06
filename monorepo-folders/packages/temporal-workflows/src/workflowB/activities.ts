export async function activityC(name: string): Promise<string> {
  console.log('hello from C', name);
  return `Hello, ${name}!`;
}

export async function activityD(name: string): Promise<string> {
  console.log('hello from D', name);
  return `Hello, ${name}!`;
}
