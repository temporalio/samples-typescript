import fetch from 'node-fetch';

export async function greetHTTP(name: string): Promise<string> {
  const response = await fetch('http://httpbin.org/get?greeting=Hello');
  const body: any = await response.json();
  return `${body.args.greeting}, ${name}!`;
}
