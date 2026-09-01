import { InMemoryRunner, LlmAgent, isFinalResponse, stringifyContent } from '@google/adk';
import { TemporalMCPToolset, TemporalModel } from '@temporalio/google-adk-agents/workflow';

export async function filesystemAgent(prompt: string): Promise<string> {
  const agent = new LlmAgent({
    name: 'filesystem_agent',
    model: new TemporalModel('gemini-2.5-flash'),
    instruction: 'Use your tools to answer questions about files.',
    tools: [new TemporalMCPToolset({ name: 'filesystem' })],
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
