import { Model } from '@strands-agents/sdk';
import type { BaseModelConfig, Message, ModelStreamEvent, StreamOptions } from '@strands-agents/sdk';

export class StubModel extends Model<BaseModelConfig> {
  private readonly turns: ModelStreamEvent[][];
  private turnIndex = 0;

  constructor(turns: ModelStreamEvent[][]) {
    super();
    this.turns = turns;
  }

  override updateConfig(_: BaseModelConfig): void {}
  override getConfig(): BaseModelConfig {
    return {};
  }

  override async *stream(_messages: Message[], _options?: StreamOptions): AsyncIterable<ModelStreamEvent> {
    if (this.turnIndex >= this.turns.length) {
      throw new Error('StubModel exhausted: no more turns');
    }
    const events = this.turns[this.turnIndex++]!;
    for (const event of events) {
      yield event;
    }
  }
}

export function textTurn(text: string): ModelStreamEvent[] {
  return [
    { type: 'modelMessageStartEvent', role: 'assistant' },
    { type: 'modelContentBlockStartEvent' },
    { type: 'modelContentBlockDeltaEvent', delta: { type: 'textDelta', text } },
    { type: 'modelContentBlockStopEvent' },
    { type: 'modelMessageStopEvent', stopReason: 'endTurn' },
  ];
}

export function toolCallTurn(toolName: string, toolUseId: string, input: object): ModelStreamEvent[] {
  return [
    { type: 'modelMessageStartEvent', role: 'assistant' },
    {
      type: 'modelContentBlockStartEvent',
      start: { type: 'toolUseStart', name: toolName, toolUseId },
    },
    {
      type: 'modelContentBlockDeltaEvent',
      delta: { type: 'toolUseInputDelta', input: JSON.stringify(input) },
    },
    { type: 'modelContentBlockStopEvent' },
    { type: 'modelMessageStopEvent', stopReason: 'toolUse' },
  ];
}
