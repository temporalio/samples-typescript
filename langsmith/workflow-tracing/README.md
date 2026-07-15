# Workflow Tracing

Two `traceable` calls run directly in a Workflow body. A naive tracer re-emits every run on every history replay and floods the project with duplicates; this plugin makes Workflow-body `traceable` calls **replay-safe**: the runs get deterministic IDs, are emitted out-of-isolate via a Temporal Sink, and are suppressed during replay. The Client starts the Workflow from inside its own `traceable` (`user_pipeline`) so the two Workflow-body runs nest under it.

Sequential `await`ed `traceable` calls in a Workflow body parent under the propagated run exactly; see the integration README for the concurrency caveat around `Promise.all` fan-out.

## Run

Run these from the `langsmith/` root (run `npm install` there once first). To see live traces, `export LANGSMITH_TRACING=true` and `export LANGSMITH_API_KEY=...` in each terminal.

```bash
# In one terminal, start the Worker (requires a local Temporal server):
npx ts-node workflow-tracing/src/worker.ts

# In another terminal, run the scenario:
npx ts-node workflow-tracing/src/client.ts
```

## Test

```bash
npx mocha --exit --require ts-node/register --require source-map-support/register "workflow-tracing/src/mocha/*.test.ts"
```

The test forces replay on every Workflow Task (`maxCachedWorkflows: 0`) and asserts each Workflow-body run is emitted exactly once, so it exercises the replay-safety guarantee directly. It uses an in-memory LangSmith Client, so no API key is required.

## Expected trace

```
user_pipeline
  extract_key_points
  summarize
```
