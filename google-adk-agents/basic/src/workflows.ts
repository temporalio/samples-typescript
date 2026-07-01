import { InMemoryRunner, LlmAgent, isFinalResponse, stringifyContent } from '@google/adk';
import { TemporalModel } from '@temporalio/google-adk-agents';

export async function helloWorld(prompt: string): Promise<string> {
  const agent = new LlmAgent({
    name: 'assistant',
    model: new TemporalModel('gemini-2.5-flash'),
    instruction: 'You are a helpful assistant. Respond in a single sentence.',
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
