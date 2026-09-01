import { InMemoryRunner, LlmAgent, isFinalResponse, stringifyContent } from '@google/adk';
import { TemporalModel } from '@temporalio/google-adk-agents/workflow';
import { condition, continueAsNew, defineQuery, defineUpdate, setHandler } from '@temporalio/workflow';

export interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export interface ChatState {
  messages: Message[];
  turns: number;
  runs: number;
}

export const sendMessage = defineUpdate<string, [string]>('sendMessage');
export const getChatState = defineQuery<ChatState>('getChatState');

export async function agentChat(messages: Message[] = [], turns = 0, runs = 1, turnsPerRun = 3): Promise<void> {
  let processing = 0;
  let nextUpdate = 0;
  let currentUpdate = 0;
  // @@@SNIPSTART typescript-google-adk-agent-chat-workflow
  const agent = new LlmAgent({
    name: 'assistant',
    model: new TemporalModel('gemini-2.5-flash'),
    instruction: 'Continue the conversation using its prior context. Respond in one sentence.',
  });
  const runner = new InMemoryRunner({ agent, appName: 'agent-chat' });
  // @@@SNIPEND
  const sessionId = `run-${runs}`;
  await runner.sessionService.createSession({ appName: runner.appName, userId: 'user', sessionId });
  setHandler(getChatState, () => ({ messages, turns, runs }));
  setHandler(sendMessage, async (prompt) => {
    const update = nextUpdate++;
    processing++;
    try {
      await condition(() => update === currentUpdate);
      const transcript = messages.map((message) => `${message.role}: ${message.text}`).join('\n');
      let answer = '';
      for await (const event of runner.runAsync({
        userId: 'user',
        sessionId,
        newMessage: { role: 'user', parts: [{ text: `${transcript}${transcript ? '\n' : ''}user: ${prompt}` }] },
      })) {
        if (isFinalResponse(event)) answer = stringifyContent(event);
      }
      messages = [...messages, { role: 'user', text: prompt }, { role: 'assistant', text: answer }];
      turns++;
      return answer;
    } finally {
      currentUpdate++;
      processing--;
    }
  });

  await condition(() => turns >= turnsPerRun && processing === 0);
  await continueAsNew<typeof agentChat>(messages, 0, runs + 1, turnsPerRun);
}
