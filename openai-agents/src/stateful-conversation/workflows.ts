import type { AgentInputItem } from '@openai/agents-core';
import { TemporalOpenAIRunner } from '@temporalio/openai-agents/workflow';
import { condition, continueAsNew, defineQuery, defineUpdate, setHandler, workflowInfo } from '@temporalio/workflow';
import { initAgents, type AirlineAgentContext } from './agents';

export const processUserMessage = defineUpdate<string, [string]>('processUserMessage');
export const getHistory = defineQuery<string[]>('getHistory');

export interface StatefulConversationState {
  history: string[];
  currentAgentName: string;
  context: AirlineAgentContext;
  inputItems: AgentInputItem[];
}

export async function statefulConversationWorkflow(state?: StatefulConversationState): Promise<void> {
  const runner = new TemporalOpenAIRunner();

  const history: string[] = state?.history ?? [];
  const context: AirlineAgentContext = state?.context ?? {};
  let inputItems: AgentInputItem[] = state?.inputItems ?? [];
  let currentAgentName = state?.currentAgentName ?? initAgents().startingAgent.name;

  setHandler(getHistory, () => history);

  setHandler(processUserMessage, async (message: string): Promise<string> => {
    history.push(`User: ${message}`);
    inputItems = [...inputItems, { role: 'user', content: message }];

    const { agentsByName } = initAgents();
    const currentAgent = agentsByName.get(currentAgentName);
    if (!currentAgent) {
      throw new Error(`Unknown agent: ${currentAgentName}`);
    }

    const result = await runner.run(currentAgent, inputItems, { context });

    for (const item of result.newItems) {
      if (item.type === 'message_output_item') {
        const text = item.rawItem.content.map((c) => ('text' in c ? c.text : '')).join('');
        history.push(`${item.agent.name}: ${text}`);
      } else if (item.type === 'handoff_output_item') {
        history.push(`Handed off from ${item.sourceAgent.name} to ${item.targetAgent.name}`);
      } else if (item.type === 'tool_call_item') {
        history.push(`${item.agent.name}: calling a tool`);
      } else if (item.type === 'tool_call_output_item') {
        history.push(`${item.agent.name}: tool output: ${String(item.output)}`);
      }
    }

    inputItems = result.history;
    currentAgentName = result.lastAgent?.name ?? currentAgentName;

    return result.finalOutput ?? '';
  });

  await condition(() => workflowInfo().continueAsNewSuggested);

  await continueAsNew<typeof statefulConversationWorkflow>({
    history,
    currentAgentName,
    context,
    inputItems,
  });
}
