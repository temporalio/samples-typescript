import { Agent, handoff } from '@openai/agents-core';
import type { HandoffInputData } from '@openai/agents-core';
import { TemporalOpenAIRunner } from '@temporalio/openai-agents/workflow';

type AgentHandoffsInput = { prompt: string };
type AgentHandoffsResult = { text: string };

export async function agentHandoffs({ prompt }: AgentHandoffsInput): Promise<AgentHandoffsResult> {
  const billingAgent = new Agent({
    name: 'billing',
    instructions: 'You are a billing specialist. Help with billing questions.',
  });

  const supportAgent = new Agent({
    name: 'support',
    instructions: 'You are a support specialist. Help with support questions.',
  });

  const triageAgent = new Agent({
    name: 'triage',
    instructions: 'You are a triage agent. Route billing questions to billing and support questions to support.',
    handoffs: [billingAgent, supportAgent],
  });

  const runner = new TemporalOpenAIRunner();
  const result = await runner.run(triageAgent, prompt);
  return { text: result.finalOutput ?? '' };
}

type HandoffFunctionInput = { prompt: string };
type HandoffFunctionResult = { text: string };

export async function handoffFunction({ prompt }: HandoffFunctionInput): Promise<HandoffFunctionResult> {
  const billingAgent = new Agent({
    name: 'billing',
    instructions: 'You are a billing specialist. Help with billing questions.',
  });

  const supportAgent = new Agent({
    name: 'support',
    instructions: 'You are a support specialist. Help with support questions.',
  });

  const triageAgent = new Agent({
    name: 'triage',
    instructions: 'You are a triage agent. Route billing questions to billing and support questions to support.',
    handoffs: [handoff(billingAgent), handoff(supportAgent)],
  });

  const runner = new TemporalOpenAIRunner();
  const result = await runner.run(triageAgent, prompt);
  return { text: result.finalOutput ?? '' };
}

function dropNewItems(data: HandoffInputData): HandoffInputData {
  return {
    ...data,
    newItems: [],
  };
}

type HandoffWithFilterInput = { prompt: string };
type HandoffWithFilterResult = { text: string };

export async function handoffWithFilter({ prompt }: HandoffWithFilterInput): Promise<HandoffWithFilterResult> {
  const billingAgent = new Agent({
    name: 'billing',
    instructions: 'You are a billing specialist. Help with billing questions.',
  });

  const supportAgent = new Agent({
    name: 'support',
    instructions: 'You are a support specialist. Help with support questions.',
  });

  const triageAgent = new Agent({
    name: 'triage',
    instructions: 'You are a triage agent. Route billing questions to billing and support questions to support.',
    handoffs: [
      handoff(billingAgent, { inputFilter: dropNewItems }),
      handoff(supportAgent, { inputFilter: dropNewItems }),
    ],
  });

  const runner = new TemporalOpenAIRunner();
  const result = await runner.run(triageAgent, prompt);
  return { text: result.finalOutput ?? '' };
}
