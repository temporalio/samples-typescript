# Google ADK Agents: Tools

Exposes an existing Temporal Activity to the ADK agent as a tool with `activityAsTool`. When the model decides to call `getWeather`, the tool dispatches the registered `getWeather` Activity — durable and retriable — instead of running the I/O inside the Workflow body.

## Run

Run these from the `google-adk-agents/` root (run `npm install` there once first).

```bash
# In one terminal, start the Worker (requires a local Temporal server and GOOGLE_API_KEY):
GOOGLE_API_KEY=... npx ts-node tools/src/worker.ts

# In another terminal, run the scenario:
npx ts-node tools/src/client.ts
```

## Test

```bash
npx mocha --exit --require ts-node/register --require source-map-support/register "tools/src/mocha/*.test.ts"
```

The test runs a real Worker against `TestWorkflowEnvironment` and dispatches the `activityAsTool` tool directly, asserting the named Activity round-trips. No `GOOGLE_API_KEY` is required.
