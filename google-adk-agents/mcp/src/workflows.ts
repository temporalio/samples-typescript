import { InMemoryRunner, LlmAgent, isFinalResponse, stringifyContent } from '@google/adk';
import { TemporalMcpToolSet, TemporalModel } from '@temporalio/google-adk-agents';

export async function filesystemAgent(prompt: string): Promise<string> {
  const agent = new LlmAgent({
    name: 'filesystem_agent',
    model: new TemporalModel('gemini-2.5-flash'),
    instruction: 'Use your tools to answer questions about files.',
    tools: [new TemporalMcpToolSet({ name: 'filesystem' })],
  });

  const runner = new InMemoryRunner({ agent });

  let finalText = '';
  for await (const event of runner.runEphemeral({
    userId: 'user',
    newMessage: { role: 'user', parts: [{ text: prompt }] },
  })) {
    if (isFinalResponse(event)) {
      finalText = stringifyContent(event);
    }
  }
  return finalText;
}

export async function listFilesystemTools(): Promise<string[]> {
  const toolset = new TemporalMcpToolSet({ name: 'filesystem' });
  const tools = await toolset.getTools();
  return tools.map((tool) => tool.name);
}
