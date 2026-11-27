// @@@SNIPSTART typescript-strands-mcp-workflow
import { TemporalAgent, TemporalMCPClient } from '@temporalio/strands-agents';

type McpWorkflowInput = { prompt: string };
type McpWorkflowResult = { text: string };

export async function mcpWorkflow({ prompt }: McpWorkflowInput): Promise<McpWorkflowResult> {
  const echo = new TemporalMCPClient({
    server: 'echo',
    activityOptions: { startToCloseTimeout: '30 seconds', retry: { maximumAttempts: 3 } },
  });
  const agent = new TemporalAgent({
    activityOptions: { startToCloseTimeout: '60 seconds', retry: { maximumAttempts: 3 } },
    tools: [echo],
  });
  const result = await agent.invoke(prompt);
  return { text: result.toString() };
}
// @@@SNIPEND
