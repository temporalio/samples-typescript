import { Agent, RunState, tool } from '@openai/agents-core';
import { TemporalOpenAIRunner } from '@temporalio/openai-agents/workflow';
import { condition, continueAsNew, defineSignal, setHandler } from '@temporalio/workflow';

export const approveSignal = defineSignal('approve');

export interface ApprovalInput {
  resumeFromRunState?: string;
}

export async function approvalWorkflow(input: ApprovalInput = {}): Promise<string> {
  const action = tool({
    name: 'dangerousAction',
    description: 'Performs a dangerous action that requires human approval before execution.',
    parameters: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'The reason for performing the dangerous action.' },
      },
      required: ['reason'],
      additionalProperties: false,
    } as const,
    needsApproval: true,
    execute: async (args) => `did: ${(args as { reason: string }).reason}`,
  });

  const agent = new Agent({
    name: 'Approver',
    instructions: "You carry out the user's request using the dangerousAction tool.",
    tools: [action],
    modelSettings: { toolChoice: 'required' },
  });

  const runner = new TemporalOpenAIRunner();

  if (input.resumeFromRunState !== undefined) {
    const state = await RunState.fromString(agent, input.resumeFromRunState);
    for (const interruption of state.getInterruptions()) {
      state.approve(interruption);
    }
    const resumed = await runner.run(agent, state);
    return resumed.finalOutput ?? '';
  }

  let approved = false;
  setHandler(approveSignal, () => {
    approved = true;
  });

  const result = await runner.run(agent, 'Delete the old backup files.');

  if (result.interruptions.length === 0) {
    return result.finalOutput ?? '';
  }

  await condition(() => approved);
  await continueAsNew<typeof approvalWorkflow>({ resumeFromRunState: result.state.toString() });
  throw new Error('unreachable');
}
