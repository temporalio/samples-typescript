# Activity Tracing

A `traceable` model call runs inside an Activity body. The Client starts the Workflow from inside its own `traceable` (`user_pipeline`), so the whole call nests under one trace. With `addTemporalRuns: true` the plugin also emits the Temporal scaffolding runs (`StartWorkflow:`, `RunActivity:`, …).

## Run

Run these from the `langsmith/` root (run `npm install` there once first). To see live traces, `export LANGSMITH_TRACING=true` and `export LANGSMITH_API_KEY=...` in each terminal.

```bash
# In one terminal, start the Worker (requires a local Temporal server):
npx ts-node activity-tracing/src/worker.ts

# In another terminal, run the scenario:
npx ts-node activity-tracing/src/client.ts
```

## Test

```bash
npx mocha --exit --require ts-node/register --require source-map-support/register "activity-tracing/src/mocha/*.test.ts"
```

The test runs a real Worker against `TestWorkflowEnvironment` with an in-memory LangSmith Client, so no API key is required.

## Expected trace

```
user_pipeline
  StartWorkflow:GreetingWorkflow
  RunWorkflow:GreetingWorkflow
    StartActivity:answer
    RunActivity:answer
      inner_llm_call
```
