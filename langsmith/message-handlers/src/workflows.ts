import { traceable } from 'langsmith/traceable';
import { allHandlersFinished, condition, defineSignal, defineUpdate, setHandler } from '@temporalio/workflow';

const classifyMessage = traceable(async (text: string): Promise<string> => `intent:${text}`, {
  name: 'classify_intent',
});

const draftReply = traceable(async (text: string): Promise<string> => `reply:${text}`, {
  name: 'draft_reply',
});

export const handleMessage = defineSignal<[string]>('handle_message');
export const composeReply = defineUpdate<string, [string]>('compose_reply');
export const complete = defineSignal('complete');

export async function ConversationWorkflow(): Promise<string[]> {
  const log: string[] = [];
  let done = false;

  setHandler(handleMessage, async (text: string) => {
    log.push(await classifyMessage(text));
  });

  setHandler(composeReply, async (text: string) => {
    const reply = await draftReply(text);
    log.push(reply);
    return reply;
  });

  setHandler(complete, () => {
    done = true;
  });

  await condition(() => done && allHandlersFinished());
  return log;
}
