import { Agent, RunContext, RunToolApprovalItem } from '@openai/agents-core';
import { hostedMcpTool } from '@openai/agents-core';
import { TemporalOpenAIRunner } from '@temporalio/openai-agents/workflow';
import { condition, defineSignal, setHandler } from '@temporalio/workflow';

const HOSTED_MCP_SERVER_LABEL = 'gitmcp';
const HOSTED_MCP_SERVER_URL = 'https://gitmcp.io/openai/codex';

type SimpleInput = { prompt: string };
type SimpleResult = { text: string };

export async function simple({ prompt }: SimpleInput): Promise<SimpleResult> {
  const agent = new Agent({
    name: 'HostedMcpSimpleAgent',
    instructions: 'You are a helpful assistant. Use the hosted MCP tools when they are relevant.',
    tools: [
      hostedMcpTool({
        serverLabel: HOSTED_MCP_SERVER_LABEL,
        serverUrl: HOSTED_MCP_SERVER_URL,
        requireApproval: 'never',
      }),
    ],
  });
  const result = await new TemporalOpenAIRunner().run(agent, prompt);
  return { text: result.finalOutput ?? '' };
}

type ApprovalDecisionInput = { approve: boolean };
type ApprovalInput = { prompt: string };
type ApprovalResult = { text: string };

export const approvalDecision = defineSignal<[ApprovalDecisionInput]>('approvalDecision');

export async function approval({ prompt }: ApprovalInput): Promise<ApprovalResult> {
  let decision: boolean | undefined;
  setHandler(approvalDecision, ({ approve }) => {
    decision = approve;
  });

  await condition(() => decision !== undefined);

  const agent = new Agent({
    name: 'HostedMcpApprovalAgent',
    instructions: 'You are a helpful assistant. Use the hosted MCP tools when they are relevant.',
    tools: [
      hostedMcpTool({
        serverLabel: HOSTED_MCP_SERVER_LABEL,
        serverUrl: HOSTED_MCP_SERVER_URL,
        requireApproval: 'always',
        onApproval: async (_context: RunContext, _item: RunToolApprovalItem) => {
          await condition(() => decision !== undefined);
          return { approve: decision === true };
        },
      }),
    ],
  });

  const result = await new TemporalOpenAIRunner().run(agent, prompt);
  return { text: result.finalOutput ?? '' };
}
