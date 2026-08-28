import { BaseLlm } from '@google/adk';
import type { BaseLlmConnection, LlmRequest, LlmResponse } from '@google/adk';

export function offlineModelProvider(): (model: string) => BaseLlm {
  class OfflineLlm extends BaseLlm {
    override async *generateContentAsync(request: LlmRequest): AsyncGenerator<LlmResponse, void> {
      const agent = request.config?.labels?.['adk_agent_name'];
      if (agent === 'coordinator' || agent === 'researcher') {
        yield {
          content: {
            role: 'model',
            parts: [
              {
                functionCall: {
                  name: 'transfer_to_agent',
                  args: { agentName: agent === 'coordinator' ? 'researcher' : 'writer' },
                },
              },
            ],
          },
          turnComplete: true,
        };
        return;
      }
      yield {
        content: {
          role: 'model',
          parts: [{ text: 'Retries fade away\nDurable words cross the years\nWorkflows remember' }],
        },
        turnComplete: true,
      };
    }

    override async connect(): Promise<BaseLlmConnection> {
      throw new Error('OfflineLlm does not support connect().');
    }
  }
  return (model) => new OfflineLlm({ model });
}
