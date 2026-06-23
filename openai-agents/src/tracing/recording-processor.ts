import type { Span, SpanData, Trace, TracingProcessor } from '@openai/agents-core';

export class RecordingTracingProcessor implements TracingProcessor {
  readonly spanTypes: string[] = [];
  readonly traceIds: string[] = [];

  async onTraceStart(trace: Trace): Promise<void> {
    this.traceIds.push(trace.traceId);
  }

  async onTraceEnd(_trace: Trace): Promise<void> {}

  async onSpanStart(_span: Span<SpanData>): Promise<void> {}

  async onSpanEnd(span: Span<SpanData>): Promise<void> {
    this.spanTypes.push(span.spanData.type);
  }

  async shutdown(_timeout?: number): Promise<void> {}

  async forceFlush(): Promise<void> {}
}
