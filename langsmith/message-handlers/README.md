# Message Handlers

`traceable` calls run inside a Signal handler and an Update handler. Handler-body `traceable` runs use Workflow-body semantics and nest under the handler's own run (`HandleSignal:` / `HandleUpdate:`). Temporal-internal queries (`__temporal*`, `__stack_trace`) are never traced. The Workflow stays alive with `condition` until a completing Signal arrives. `addTemporalRuns: true` makes the handler runs visible.

## Run

Run these from the `langsmith/` root (run `npm install` there once first). To see live traces, `export LANGSMITH_TRACING=true` and `export LANGSMITH_API_KEY=...` in each terminal.

```bash
# In one terminal, start the Worker (requires a local Temporal server):
npx ts-node message-handlers/src/worker.ts

# In another terminal, run the scenario:
npx ts-node message-handlers/src/client.ts
```

## Test

```bash
npx mocha --exit --require ts-node/register --require source-map-support/register "message-handlers/src/mocha/*.test.ts"
```

The test runs a real Worker against `TestWorkflowEnvironment` with an in-memory LangSmith Client, so no API key is required.

## Expected trace

```
HandleSignal:handle_message
  classify_intent
HandleUpdate:compose_reply
  draft_reply
```
