import { createActivityHandle } from '@temporalio/workflow';
import { Example } from '../interfaces';
import type * as activities from '../activities';

const { makeHTTPRequest } = createActivityHandle<typeof activities>({
  scheduleToCloseTimeout: '5 minutes',
});

export const example: Example = () => ({
  async execute(): Promise<string> {
    const answer = await makeHTTPRequest();
    return `The answer is ${answer}`;
  },
});
