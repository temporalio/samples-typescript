import { Example } from '../interfaces/workflows';
import { makeHTTPRequest } from '@activities/makeHTTPRequest';

async function main(): Promise<string> {
  const answer = await makeHTTPRequest();
  return `The answer is ${answer}`;
}

export const workflow: Example = { main };