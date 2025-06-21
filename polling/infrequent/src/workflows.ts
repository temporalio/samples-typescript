// @@@SNIPSTART typescript-polling-frequent
import type * as activities from './activities';

const { composeGreeting } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  heartbeatTimeout: '2s',
});

export async function greetingWorkflow(name: string): Promise<string> {
  return await composeGreeting({
    greeting: "Hello",
    name,
  })
}
// @@@SNIPEND