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
  readonly exhausted: Promise<void>;
  private readonly responses: ModelResponse[];
  private markExhausted!: () => void;

  constructor(responses: ModelResponse[]) {
    this.responses = [...responses];
    this.exhausted = new Promise((resolve) => {
      this.markExhausted = resolve;
    });
  }

  async getResponse(request: ModelRequest): Promise<ModelResponse> {
    this.requests.push(request);
    const response = this.responses.shift();
    if (!response) {
      this.markExhausted();
      throw new Error(`FakeModel: no more canned responses (call ${this.requests.length})`);
    }
    return response;
  }

  getStreamedResponse(_request: ModelRequest): AsyncIterable<StreamEvent> {
    throw new Error('Streaming not supported in FakeModel');
  }
}

export class FakeModelProvider implements ModelProvider {
  readonly model: FakeModel;

  constructor(responses: ModelResponse[]) {
    this.model = new FakeModel(responses);
  }

  getModel(_name?: string): Model {
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

let nextCallId = 0;

export function toolCallResponse(toolName: string, args: Record<string, unknown>): ModelResponse {
  const output: AgentOutputItem[] = [
    {
      type: 'function_call',
      name: toolName,
      arguments: JSON.stringify(args),
      callId: `call_fake_${++nextCallId}`,
      status: 'completed',
    },
  ];
  return { output, usage: fakeUsage(20) };
}

export function toolOutputs(model: FakeModel, toolName: string): string[] {
  const outputs = new Map<string, string>();
  for (const item of model.requests.flatMap((request) => (Array.isArray(request.input) ? request.input : []))) {
    if (item.type === 'function_call_result' && item.name === toolName) {
      const output = item.output;
      outputs.set(item.callId, typeof output === 'string' ? output : JSON.stringify(output));
    }
  }
  return [...outputs.values()];
}
