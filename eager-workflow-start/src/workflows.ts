import { proxyLocalActivities } from '@temporalio/workflow';
import type * as activities from './activities';

const { greet } = proxyLocalActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

/** A workflow that calls a local activity */
type EagerWorkflowInput = { name: string };

export async function eagerWorkflow(input: EagerWorkflowInput): Promise<activities.GreetResult> {
  return await greet(input);
}
