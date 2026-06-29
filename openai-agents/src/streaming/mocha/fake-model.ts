import {
  type AgentOutputItem,
  type Model,
  type ModelProvider,
  type ModelRequest,
  type ModelResponse,
  type StreamEvent,
} from '@openai/agents-core';

export function streamingTextEvents(text: string): StreamEvent[] {
  const output: AgentOutputItem[] = [
    {
      type: 'message',
      id: 'msg_fake_stream_001',
      role: 'assistant',
      content: [{ type: 'output_text', text }],
      status: 'completed',
    },
  ];
  return [
    { type: 'output_text_delta', delta: text },
    {
      type: 'response_done',
      response: {
        id: 'resp_fake_stream_001',
        usage: { requests: 1, inputTokens: 10, outputTokens: text.length, totalTokens: 10 + text.length },
        output,
      },
    },
  ] as StreamEvent[];
}

export class StreamingFakeModel implements Model {
  constructor(private readonly events: StreamEvent[]) {}
  async getResponse(_request: ModelRequest): Promise<ModelResponse> {
    throw new Error('StreamingFakeModel only supports getStreamedResponse');
  }
  async *getStreamedResponse(_request: ModelRequest): AsyncIterable<StreamEvent> {
    for (const event of this.events) {
      yield event;
    }
  }
}

export class StreamingFakeModelProvider implements ModelProvider {
  private readonly model: StreamingFakeModel;
  constructor(events: StreamEvent[]) {
    this.model = new StreamingFakeModel(events);
  }
  getModel(_name?: string): Model {
    return this.model;
  }
}
