import { Agent } from '@openai/agents-core';
import type { AgentInputItem } from '@openai/agents-core';
import { TemporalOpenAIRunner, WorkflowSafeMemorySession } from '@temporalio/openai-agents/workflow';
import { continueAsNew } from '@temporalio/workflow';

export async function multiTurnChat(prompts: string[]): Promise<string[]> {
  const agent = new Agent({ name: 'ChatAgent', instructions: 'You are a helpful assistant.' });
  const session = new WorkflowSafeMemorySession();
  const runner = new TemporalOpenAIRunner();
  const replies: string[] = [];
  for (const prompt of prompts) {
    const result = await runner.run(agent, prompt, { session });
    replies.push(result.finalOutput ?? '');
  }
  return replies;
}

export interface CarryoverChatInput {
  prompts: string[];
  initialItems?: AgentInputItem[];
  accumulated?: string[];
}

export async function carryoverChat(input: CarryoverChatInput): Promise<string[] | void> {
  const agent = new Agent({ name: 'ChatAgent', instructions: 'You are a helpful assistant.' });
  const session = new WorkflowSafeMemorySession({ initialItems: input.initialItems });
  const runner = new TemporalOpenAIRunner();
  const accumulated = input.accumulated ?? [];

  const [prompt, ...remaining] = input.prompts;
  if (prompt === undefined) {
    return accumulated;
  }

  const result = await runner.run(agent, prompt, { session });
  accumulated.push(result.finalOutput ?? '');

  if (remaining.length === 0) {
    return accumulated;
  }

  const items = await session.getItems();
  await continueAsNew<typeof carryoverChat>({
    prompts: remaining,
    initialItems: items,
    accumulated,
  });
}
