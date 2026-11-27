import { Agent } from '@openai/agents-core';
import type { AgentInputItem } from '@openai/agents-core';
import { TemporalOpenAIRunner, WorkflowSafeMemorySession } from '@temporalio/openai-agents/workflow';
import { continueAsNew } from '@temporalio/workflow';

// @@@SNIPSTART typescript-openai-agents-session-workflow
type MultiTurnChatInput = { prompts: string[] };
type MultiTurnChatResult = { replies: string[] };

export async function multiTurnChat({ prompts }: MultiTurnChatInput): Promise<MultiTurnChatResult> {
  const agent = new Agent({ name: 'ChatAgent', instructions: 'You are a helpful assistant.' });
  const session = new WorkflowSafeMemorySession();
  const runner = new TemporalOpenAIRunner();
  const replies: string[] = [];
  for (const prompt of prompts) {
    const result = await runner.run(agent, prompt, { session });
    replies.push(result.finalOutput ?? '');
  }
  return { replies };
}
// @@@SNIPEND

export interface CarryoverChatInput {
  prompts: string[];
  initialItems?: AgentInputItem[];
  accumulated?: string[];
}

// @@@SNIPSTART typescript-openai-agents-session-carryover-workflow
type CarryoverChatResult = { replies: string[] };

export async function carryoverChat(input: CarryoverChatInput): Promise<CarryoverChatResult> {
  const agent = new Agent({ name: 'ChatAgent', instructions: 'You are a helpful assistant.' });
  const session = new WorkflowSafeMemorySession({ initialItems: input.initialItems });
  const runner = new TemporalOpenAIRunner();
  const accumulated = input.accumulated ?? [];

  const [prompt, ...remaining] = input.prompts;
  if (prompt === undefined) {
    return { replies: accumulated };
  }

  const result = await runner.run(agent, prompt, { session });
  accumulated.push(result.finalOutput ?? '');

  if (remaining.length === 0) {
    return { replies: accumulated };
  }

  const items = await session.getItems();
  return continueAsNew<typeof carryoverChat>({
    prompts: remaining,
    initialItems: items,
    accumulated,
  });
}
// @@@SNIPEND
