import { proxyLocalActivities } from '@temporalio/workflow';
import type * as activities from './activities';

const { greet } = proxyLocalActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

/** A workflow that calls a local activity */
export async function eagerWorkflow(name: string): Promise<string> {
  return await greet(name);
}
