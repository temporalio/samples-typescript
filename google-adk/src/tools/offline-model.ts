import { BaseLlm } from '@google/adk';
import type { BaseLlmConnection, LlmRequest, LlmResponse } from '@google/adk';

export function offlineModelProvider(): (model: string) => BaseLlm {
  class OfflineLlm extends BaseLlm {
    override async *generateContentAsync(request: LlmRequest): AsyncGenerator<LlmResponse, void> {
      const responses = (request.contents ?? [])
        .flatMap((content) => content.parts ?? [])
        .map((part) => part.functionResponse)
        .filter((response) => response !== undefined);
      if (!responses.some((response) => response.name === 'celsiusToFahrenheit')) {
        yield {
          content: { role: 'model', parts: [{ functionCall: { name: 'celsiusToFahrenheit', args: { celsius: 17 } } }] },
          turnComplete: true,
        };
        return;
      }
      if (!responses.some((response) => response.name === 'getWeather')) {
        yield {
          content: { role: 'model', parts: [{ functionCall: { name: 'getWeather', args: { city: 'Tokyo' } } }] },
          turnComplete: true,
        };
        return;
      }
      yield {
        content: { role: 'model', parts: [{ text: 'Tokyo is 17°C (62.6°F), warm and sunny.' }] },
        turnComplete: true,
      };
    }

    override async connect(): Promise<BaseLlmConnection> {
      throw new Error('OfflineLlm does not support connect().');
    }
  }
  return (model) => new OfflineLlm({ model });
}
