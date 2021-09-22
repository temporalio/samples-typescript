import { createActivityHandle } from '@temporalio/workflow';
import { Example } from './interfaces';
import type * as activities from './activities';

const { 
  makeHTTPRequest,
  // fakeProgress, // todo: demo usage
  // cancellableFetch  // todo: demo usage
 } = createActivityHandle<typeof activities>({
  retry: {
    initialInterval: '50 milliseconds',
    maximumAttempts: 2,
  },
  scheduleToCloseTimeout: '30 seconds',
});

export const example: Example = () => ({
  async execute(): Promise<string> {
    const answer = await makeHTTPRequest();
    return `The answer is ${answer}`;
  },
});
