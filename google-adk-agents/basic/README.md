# Google ADK Agents: Basic

A single ADK `LlmAgent` whose model is a `TemporalModel`, driven by `InMemoryRunner` for one durable model call. The only change from a vanilla ADK agent is wrapping the model in `TemporalModel`; the agent loop runs inside the Workflow while the model call runs as an Activity.

## Run

Run these from the `google-adk-agents/` root (run `npm install` there once first).

```bash
# In one terminal, start the Worker (requires a local Temporal server and GOOGLE_API_KEY):
GOOGLE_API_KEY=... npx ts-node basic/src/worker.ts

# In another terminal, run the scenario:
npx ts-node basic/src/client.ts
```

## Test

```bash
npx mocha --exit --require ts-node/register --require source-map-support/register "basic/src/mocha/*.test.ts"
```

The test runs a real Worker against `TestWorkflowEnvironment` with `fakeModelProvider`, so no `GOOGLE_API_KEY` is required.
