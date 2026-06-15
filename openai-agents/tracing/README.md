# OpenAI Agents: Tracing

Shows the three tracing paths the Temporal OpenAI Agents integration supports. OpenAI Agents SDK
tracing works across Client, Workflow, Activity, Nexus, and MCP boundaries, and Workflow replay does
not duplicate spans.

The Worker selects a tracing mode (default `custom`):

```bash
npm run start.watch -- <mode>     # mode: custom | openai | otel
# or set TRACING_MODE=<mode>
```

All modes also set `interceptorOptions: { addTemporalSpans: true }`, which emits `temporal:*`
orchestration spans (Workflow starts, Activities, Signals, and so on) to whichever sink is active.

### 1. `custom` — a custom `TracingProcessor`

Registers a `RecordingTracingProcessor` (see `src/recording-processor.ts`) via `addTraceProcessor`.
It receives every trace and span lifecycle callback, so you can record, filter, or forward spans
anywhere. This is the mode exercised by the test.

### 2. `openai` — OpenAI hosted traces

Registers the upstream hosted exporter before constructing the plugin, so traces appear on the
OpenAI dashboard:

```ts
addTraceProcessor(new BatchTraceProcessor(new OpenAITracingExporter()));
```

Register this in the Worker process, not inside Workflow code.

### 3. `otel` — OpenTelemetry

Installs a replay-safe tracer provider from `@temporalio/openai-agents/otel` and enables
`useOtelInstrumentation`:

```ts
trace.setGlobalTracerProvider(createTracerProvider());
// plugin: interceptorOptions: { useOtelInstrumentation: true }
```

`createTracerProvider` uses `TemporalIdGenerator` for replay-safe span/trace IDs. This mode requires
the optional peer dependency `@opentelemetry/sdk-trace-base`.

## Run

```bash
temporal server start-dev
```

```bash
export OPENAI_API_KEY=sk-...
npm install
npm run start.watch -- custom
```

```bash
npm run workflow "What is 42 plus 58?"
```

## Test

The test runs offline with a `FakeModelProvider`. It registers a custom `TracingProcessor`, runs an
agent that calls a function tool, and asserts that `agent` and `function` spans were emitted.

```bash
npm test
```
