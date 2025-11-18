// @@@SNIPSTART typescript-esm-workflow
import { proxyActivities } from '@temporalio/workflow';
// Only import the activity types
import type * as activities from './activities.ts';

const { greetLocal } = proxyActivities<typeof activities>({
  scheduleToCloseTimeout: '5 seconds',
});

// A variant of the preceding workflow that does not perform any HTTP requests
export async function exampleLocal(name: string): Promise<string> {
  return await greetLocal(name);
}
// @@@SNIPEND

// The sample `fetch` activity make requests to httpbin.org, which is sometime slow or flaky.
// In the case of this workflow, we prefer to fail the workflow than retry the HTTP request forever.
const { greetHTTP } = proxyActivities<typeof activities>({
  startToCloseTimeout: '3 seconds',
  retry: {
    initialInterval: '500 ms',
    maximumAttempts: 3,
    backoffCoefficient: 1.5,
  },
});

export async function exampleFetch(name: string): Promise<string> {
  return await greetHTTP(name);
}
