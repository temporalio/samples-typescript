import {
  type AssistantMessageItem,
  type Model,
  type ModelProvider,
  type ModelRequest,
  type ModelResponse,
  type StreamEvent,
} from '@openai/agents-core';

export function streamingTextEvents(text: string): StreamEvent[] {
  const output: AssistantMessageItem[] = [
    {
      type: 'message',
      id: 'msg_fake_stream_001',
      role: 'assistant',
      content: [{ type: 'output_text', text }],
      status: 'completed',
    },
  ];
  const chunks = text.match(/\s*\S+\s*/g) ?? [text];
  return [
    ...chunks.map((delta): StreamEvent => ({ type: 'output_text_delta', delta })),
    {
      type: 'response_done',
      response: {
        id: 'resp_fake_stream_001',
        usage: { requests: 1, inputTokens: 10, outputTokens: text.length, totalTokens: 10 + text.length },
        output,
      },
    },
  ];
}

export class StreamingFakeModel implements Model {
  constructor(
    private readonly events: StreamEvent[],
    private readonly finalEventGate?: Promise<void>,
  ) {}
  async getResponse(_request: ModelRequest): Promise<ModelResponse> {
    throw new Error('StreamingFakeModel only supports getStreamedResponse');
  }
  async *getStreamedResponse(_request: ModelRequest): AsyncIterable<StreamEvent> {
    for (const event of this.events.slice(0, -1)) {
      yield event;
    }
    await this.finalEventGate;
    yield this.events[this.events.length - 1];
  }
}

export class StreamingFakeModelProvider implements ModelProvider {
  private readonly model: StreamingFakeModel;
  constructor(events: StreamEvent[], finalEventGate?: Promise<void>) {
    this.model = new StreamingFakeModel(events, finalEventGate);
  }
  getModel(_name?: string): Model {
    return this.model;
  }
}
