# Agent Pipeline

A multi-step research agent. The parent `ResearchWorkflow` calls two Activities (`gatherFacts`, `writeReport`) in sequence and then runs a child Workflow (`ReviewWorkflow`) for the review step. Each Activity wraps a `traceable` model call. The trace started on the Client (`research_pipeline`) threads across every boundary — Workflow, Activity, and child Workflow — so the runs nest the way you expect instead of fragmenting into disconnected roots. `addTemporalRuns: true` makes the Temporal scaffolding runs visible.

## Run

Run these from the `langsmith/` root (run `npm install` there once first). To see live traces, `export LANGSMITH_TRACING=true` and `export LANGSMITH_API_KEY=...` in each terminal.

```bash
# In one terminal, start the Worker (requires a local Temporal server):
npx ts-node agent-pipeline/src/worker.ts

# In another terminal, run the scenario:
npx ts-node agent-pipeline/src/client.ts
```

## Test

```bash
npx mocha --exit --require ts-node/register --require source-map-support/register "agent-pipeline/src/mocha/*.test.ts"
```

The test runs a real Worker against `TestWorkflowEnvironment` with an in-memory LangSmith Client, so no API key is required.

## Expected trace

```
research_pipeline
  StartWorkflow:ResearchWorkflow
  RunWorkflow:ResearchWorkflow
    StartActivity:gatherFacts
    RunActivity:gatherFacts
      gather_llm_call
    StartActivity:writeReport
    RunActivity:writeReport
      write_llm_call
    StartChildWorkflow:ReviewWorkflow
    RunWorkflow:ReviewWorkflow
      StartActivity:reviewReport
      RunActivity:reviewReport
        review_llm_call
```
