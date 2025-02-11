import { proxyActivities, ActivityOptions } from '@temporalio/workflow';
import type * as activities from './activities';

const activityOptions: ActivityOptions = {
  startToCloseTimeout: 60 * 1000,
  heartbeatTimeout: 2 * 1000,
};

const { greet } = proxyActivities<typeof activities>(activityOptions);

export async function example(name: string): Promise<string> {
  const result = await greet(name);
  return result;
}
