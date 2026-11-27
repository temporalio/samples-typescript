import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

const { greet } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

// A workflow that simply calls an activity
type ExampleInput = { name: string };

export async function example(input: ExampleInput): Promise<activities.GreetResult> {
  return await greet(input);
}
