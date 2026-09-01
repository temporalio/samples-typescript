import { InMemoryRunner, LlmAgent, isFinalResponse, stringifyContent } from '@google/adk';
import { TemporalModel } from '@temporalio/google-adk-agents/workflow';

export async function observedAgent(prompts: string[]): Promise<string[]> {
  const agent = new LlmAgent({
    name: 'assistant',
    model: new TemporalModel('gemini-2.5-flash'),
    instruction: 'You are a helpful assistant. Respond in a single sentence.',
  });

  const runner = new InMemoryRunner({ agent });

  const answers: string[] = [];
  for (const prompt of prompts) {
    let finalText = '';
    for await (const event of runner.runEphemeral({
      userId: 'user',
      newMessage: { role: 'user', parts: [{ text: prompt }] },
    })) {
      if (isFinalResponse(event)) {
        finalText = stringifyContent(event);
      }
    }
    answers.push(finalText);
  }
  return answers;
}
