export async function greet(name: string, shouldFail: boolean): Promise<string> {
  if (shouldFail) {
    throw new Error(`I am activity ${name} and I failed!`);
  }
  return `Hello, ${name}!`;
}
