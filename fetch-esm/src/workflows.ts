// @@@SNIPSTART typescript-esm-workflow
import { createActivityHandle } from '@temporalio/workflow';
// Only import the activity types
import type * as activities from './activities.js';

const { greetHTTP } = createActivityHandle<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export async function example(name: string): Promise<string> {
  return await greetHTTP(name);
}
// @@@SNIPEND
