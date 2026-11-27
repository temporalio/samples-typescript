import { InMemoryRunner, LlmAgent, isFinalResponse, stringifyContent } from '@google/adk';
import { TemporalMCPToolset, TemporalModel } from '@temporalio/google-adk/workflow';

type FilesystemAgentInput = { prompt: string };
type FilesystemAgentResult = { text: string };

export async function filesystemAgent({ prompt }: FilesystemAgentInput): Promise<FilesystemAgentResult> {
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
  return { text: finalText };
}
