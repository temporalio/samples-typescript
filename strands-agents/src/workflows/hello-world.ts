import { TemporalAgent } from '@temporalio/strands-agents';

export async function helloWorld(prompt: string): Promise<string> {
  const agent = new TemporalAgent({
    activityOptions: { startToCloseTimeout: '60 seconds', retry: { maximumAttempts: 3 } },
  });
  const result = await agent.invoke(prompt);
  return result.toString();
}
