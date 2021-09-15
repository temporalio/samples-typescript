import { Example } from '../interfaces/workflows';
import { Context } from '@temporalio/workflow';
import * as activities from '../activities';

const { makeHTTPRequest } = Context.configureActivities<typeof activities>({
  type: 'remote',
  scheduleToCloseTimeout: '5 minutes',
});

async function main(): Promise<string> {
  const answer = await makeHTTPRequest();
  return `The answer is ${answer}`;
}

export const workflow: Example = { main };