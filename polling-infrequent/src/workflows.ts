import { proxyActivities, ActivityOptions, RetryPolicy } from '@temporalio/workflow';
import type * as activities from './activities';

const retryPolicy: RetryPolicy = {
  backoffCoefficient: 1,
  initialInterval: 5 * 1000,
};

const activityOptions: ActivityOptions = {
  retry: retryPolicy,
  startToCloseTimeout: 2 * 1000,
};

const { greet } = proxyActivities<typeof activities>(activityOptions);

export async function example(name: string): Promise<string> {
  return await greet(name);
}
