import { BaseLlm } from '@google/adk';
import type { BaseLlmConnection, LlmRequest, LlmResponse } from '@google/adk';

export function offlineModelProvider(onRequest?: (request: LlmRequest) => void): (model: string) => BaseLlm {
  class OfflineLlm extends BaseLlm {
    override async *generateContentAsync(request: LlmRequest): AsyncGenerator<LlmResponse, void> {
      onRequest?.(request);
      const text = (request.contents ?? [])
        .flatMap((content) => content.parts ?? [])
        .map((part) => part.text ?? '')
        .join('\n');
      const answer = text.includes('user: My name is Ada.\nassistant: Hello, Ada.\nuser: What is my name?')
        ? 'Your name is Ada.'
        : 'Hello, Ada.';
      yield { content: { role: 'model', parts: [{ text: answer }] }, turnComplete: true };
    }

    override async connect(): Promise<BaseLlmConnection> {
      throw new Error('OfflineLlm does not support connect().');
    }
  }
  return (model) => new OfflineLlm({ model });
}
