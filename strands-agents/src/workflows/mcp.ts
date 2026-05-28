import { TemporalAgent, TemporalMCPClient } from '@temporalio/strands-agents';

export async function mcpWorkflow(prompt: string): Promise<string> {
  const echo = new TemporalMCPClient({
    server: 'echo',
    activityOptions: { startToCloseTimeout: '30 seconds', retry: { maximumAttempts: 3 } },
  });
  const agent = new TemporalAgent({
    activityOptions: { startToCloseTimeout: '60 seconds', retry: { maximumAttempts: 3 } },
    tools: [echo],
  });
  const result = await agent.invoke(prompt);
  return result.toString();
}
