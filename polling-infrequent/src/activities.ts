import { greetService } from './testService';

export async function greet(name: string): Promise<string> {
  return greetService(name);
}
