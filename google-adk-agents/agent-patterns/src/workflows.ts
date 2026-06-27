import { InMemoryRunner, LlmAgent, isFinalResponse, stringifyContent } from '@google/adk';
import { TemporalModel } from '@temporalio/google-adk-agents';

export async function multiAgent(topic: string): Promise<string> {
  const researcher = new LlmAgent({
    name: 'researcher',
    model: new TemporalModel('gemini-2.5-flash', { summary: 'Researcher Agent' }),
    instruction: 'You are a researcher. Find information about the topic.',
  });

  const writer = new LlmAgent({
    name: 'writer',
    model: new TemporalModel('gemini-2.5-flash', { summary: 'Writer Agent' }),
    instruction: 'You are a poet. Write a haiku based on the research.',
  });

  const coordinator = new LlmAgent({
    name: 'coordinator',
    model: new TemporalModel('gemini-2.5-flash', { summary: 'Coordinator Agent' }),
    instruction: 'You are a coordinator. Delegate to the researcher, then the writer.',
    subAgents: [researcher, writer],
  });

  const runner = new InMemoryRunner({ agent: coordinator });

  let finalText = '';
  for await (const event of runner.runEphemeral({
    userId: 'user',
    newMessage: { role: 'user', parts: [{ text: `Write a haiku about ${topic}. First research it, then write it.` }] },
  })) {
    if (isFinalResponse(event)) {
      finalText = stringifyContent(event);
    }
  }
  return finalText;
}
