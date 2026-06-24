import type { Context } from '@opentelemetry/api';
import type { ReadableSpan, Span, SpanProcessor } from '@opentelemetry/sdk-trace-base';

// ADK's tracer name; the SDK's own interceptor spans arrive under a different one.
const ADK_TRACER = 'gcp.vertex.agent';

export interface ModelCall {
  model: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
}

export class AdkUsageSpanProcessor implements SpanProcessor {
  constructor(private readonly onModelCall: (call: ModelCall) => void) {}

  onStart(_span: Span, _parentContext: Context): void {}

  onEnd(span: ReadableSpan): void {
    if (span.instrumentationLibrary.name !== ADK_TRACER || span.name !== 'call_llm') return;

    this.onModelCall({
      model: String(span.attributes['gen_ai.request.model'] ?? ''),
      inputTokens: Number(span.attributes['gen_ai.usage.input_tokens'] ?? 0),
      outputTokens: Number(span.attributes['gen_ai.usage.output_tokens'] ?? 0),
      durationMs: span.duration[0] * 1e3 + span.duration[1] / 1e6,
    });
  }

  async forceFlush(): Promise<void> {}

  async shutdown(): Promise<void> {}
}
