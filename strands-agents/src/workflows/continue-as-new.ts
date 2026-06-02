// @@@SNIPSTART typescript-strands-continue-as-new-workflow
import type { Message } from '@strands-agents/sdk';
import { TemporalAgent } from '@temporalio/strands-agents';
import {
  allHandlersFinished,
  condition,
  continueAsNew,
  defineQuery,
  defineSignal,
  defineUpdate,
  setHandler,
  workflowInfo,
} from '@temporalio/workflow';

export interface ChatInput {
  messages?: Message[];
}

export const chatTurn = defineUpdate<string, [string]>('turn');
export const chatEnd = defineSignal('endChat');
export const chatMessages = defineQuery<Message[]>('messages');

export async function chatWorkflow(input: ChatInput = {}): Promise<void> {
  let done = false;
  let agent: TemporalAgent | null = null;
  // Serialize concurrent `turn` updates so they can't interleave on `agent.messages`.
  let pending: Promise<unknown> = Promise.resolve();

  setHandler(chatTurn, async (prompt) => {
    await condition(() => agent !== null);
    const prev = pending;
    let release!: () => void;
    pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    try {
      await prev;
      const result = await agent!.invoke(prompt);
      return result.toString().trim();
    } finally {
      release();
    }
  });
  setHandler(chatEnd, () => {
    done = true;
  });
  setHandler(chatMessages, () => (agent ? [...agent.messages] : []));

  agent = new TemporalAgent({
    activityOptions: { startToCloseTimeout: '60 seconds', retry: { maximumAttempts: 3 } },
    messages: input.messages ?? [],
  });

  await condition(() => done || workflowInfo().continueAsNewSuggested);
  // Drain in-flight `turn` updates before exiting or handing off.
  await condition(allHandlersFinished);

  if (!done) {
    await continueAsNew<typeof chatWorkflow>({ messages: agent.messages });
  }
}
// @@@SNIPEND
