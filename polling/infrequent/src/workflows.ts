// @@@SNIPSTART typescript-polling-infrequent
import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

const { composeGreeting } = proxyActivities<typeof activities>({
  startToCloseTimeout: '2s',
  retry: {
    initialInterval: '60s',
    backoffCoefficient: 1.0,
  },
});

export async function greetingWorkflow(name: string): Promise<string> {
  return await composeGreeting({
    greeting: "Hello",
    name,
  })
}
// @@@SNIPEND