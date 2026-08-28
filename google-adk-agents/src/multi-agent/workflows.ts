import { InMemoryRunner, LlmAgent, isFinalResponse, stringifyContent } from '@google/adk';
import { TemporalModel } from '@temporalio/google-adk-agents/workflow';

export async function multiAgent(topic: string): Promise<string> {
  const researcher = new LlmAgent({
    name: 'researcher',
    description: 'Reads a topic and hands it to whoever should write about it.',
    model: new TemporalModel('gemini-2.5-flash', { summary: 'Researcher Agent' }),
    instruction: 'You are a researcher. You write nothing yourself. Transfer the topic to the writer.',
  });

  const writer = new LlmAgent({
    name: 'writer',
    description: 'Turns a topic into a haiku.',
    model: new TemporalModel('gemini-2.5-flash', { summary: 'Writer Agent' }),
    instruction: 'You are a poet. Write a haiku about the topic in the conversation.',
  });

  const coordinator = new LlmAgent({
    name: 'coordinator',
    description:
      'Starts the relay by handing the incoming request to the first agent. Researches nothing and writes nothing.',
    model: new TemporalModel('gemini-2.5-flash', { summary: 'Coordinator Agent' }),
    instruction: 'You are a coordinator. Transfer the request to the researcher.',
    subAgents: [researcher, writer],
  });

  const runner = new InMemoryRunner({ agent: coordinator });

  let finalText = '';
  for await (const event of runner.runEphemeral({
    userId: 'user',
    newMessage: { role: 'user', parts: [{ text: `Write a haiku about ${topic}.` }] },
  })) {
    if (isFinalResponse(event)) {
      finalText = stringifyContent(event);
    }
  }
  return finalText;
}
