import {
  Usage,
  type AgentOutputItem,
  type Model,
  type ModelProvider,
  type ModelRequest,
  type ModelResponse,
  type StreamEvent,
} from '@openai/agents-core';

export class FakeModel implements Model {
  readonly requests: ModelRequest[] = [];
  private getNext: () => ModelResponse;
  constructor(source: ModelResponse[]) {
    let index = 0;
    this.getNext = () => {
      if (index >= source.length) {
        throw new Error(
          `FakeModel: no more canned responses (called ${index + 1} times, only ${source.length} provided)`,
        );
      }
      return source[index++]!;
    };
  }
  async getResponse(request: ModelRequest): Promise<ModelResponse> {
    this.requests.push(request);
    return this.getNext();
  }
  // eslint-disable-next-line require-yield
  async *getStreamedResponse(_request: ModelRequest): AsyncIterable<StreamEvent> {
    throw new Error('Streaming not supported in FakeModel');
  }
}

export class FakeModelProvider implements ModelProvider {
  readonly requestedModelNames: (string | undefined)[] = [];
  readonly model: FakeModel;
  constructor(source: ModelResponse[]) {
    this.model = new FakeModel(source);
  }
  getModel(name?: string): Model {
    this.requestedModelNames.push(name);
    return this.model;
  }
}

function fakeUsage(outputTokens: number): Usage {
  return new Usage({ requests: 1, inputTokens: 10, outputTokens, totalTokens: 10 + outputTokens });
}

export function textResponse(text: string): ModelResponse {
  const output: AgentOutputItem[] = [
    { type: 'message', role: 'assistant', content: [{ type: 'output_text', text }], status: 'completed' },
  ];
  return { output, usage: fakeUsage(text.length) };
}

export function toolCallResponse(toolName: string, args: Record<string, unknown>): ModelResponse {
  const output: AgentOutputItem[] = [
    {
      type: 'function_call',
      name: toolName,
      arguments: JSON.stringify(args),
      callId: `call_fake_${toolName}`,
      status: 'completed',
    },
  ];
  return { output, usage: fakeUsage(20) };
}
