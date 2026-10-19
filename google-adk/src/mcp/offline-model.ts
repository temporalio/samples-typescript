import { BaseLlm } from '@google/adk';
import type { BaseLlmConnection, LlmRequest, LlmResponse } from '@google/adk';

export function offlineModelProvider(): (model: string) => BaseLlm {
  class OfflineLlm extends BaseLlm {
    override async *generateContentAsync(request: LlmRequest): AsyncGenerator<LlmResponse, void> {
      const response = (request.contents ?? [])
        .flatMap((content) => content.parts ?? [])
        .find((part) => part.functionResponse?.name === 'read_file')?.functionResponse;
      if (response === undefined) {
        yield {
          content: { role: 'model', parts: [{ functionCall: { name: 'read_file', args: { path: 'hello.txt' } } }] },
          turnComplete: true,
        };
        return;
      }
      yield {
        content: { role: 'model', parts: [{ text: String((response.response as { contents: unknown }).contents) }] },
        turnComplete: true,
      };
    }

    override async connect(): Promise<BaseLlmConnection> {
      throw new Error('OfflineLlm does not support connect().');
    }
  }
  return (model) => new OfflineLlm({ model });
}
