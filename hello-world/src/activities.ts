// @@@SNIPSTART typescript-hello-activity
export async function greet(name: string): Promise<string> {
  console.log('ACTIVITY LOG', name);
  return `Hello, ${name}!`;
}
// @@@SNIPEND
