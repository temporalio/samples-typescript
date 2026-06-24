# Google ADK Agents: Basic

A single ADK `LlmAgent` whose model is a `TemporalModel`, driven by `InMemoryRunner` for one durable model call. Two things change from a vanilla ADK agent: the agent's `model` becomes `new TemporalModel('gemini-2.5-flash')` where the model name would otherwise go, and the Worker registers `GoogleAdkPlugin`. The agent loop then runs inside the Workflow while the model call runs as an Activity.

## Run

Run these from the `google-adk-agents/` root (run `npm install` there once first).

```bash
# In one terminal, start the Worker (requires a local Temporal server and GEMINI_API_KEY):
GEMINI_API_KEY=... npx ts-node src/basic/worker.ts

# In another terminal, run the scenario:
npx ts-node src/basic/client.ts
```

## Test

```bash
npx mocha --exit --require ts-node/register --require source-map-support/register "src/basic/mocha/*.test.ts"
```

The tests run a real Worker against `TestWorkflowEnvironment`, so no `GEMINI_API_KEY` is required: one answers through `fakeModelProvider`, the other fails the model call and asserts the Workflow fails with it.
