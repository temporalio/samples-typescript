# Google ADK Agents: Tools

Exposes an existing Temporal Activity to the ADK agent as a tool with `activityAsTool`. When the model decides to call `getWeather`, the tool dispatches the registered `getWeather` Activity — durable and retriable — instead of running the I/O inside the Workflow body.

## Run

Run these from the `google-adk-agents/` root (run `npm install` there once first).

```bash
# In one terminal, start the Worker (requires a local Temporal server and GEMINI_API_KEY):
GEMINI_API_KEY=... npx ts-node src/tools/worker.ts

# In another terminal, run the scenario:
npx ts-node src/tools/client.ts
```

## Test

```bash
npx mocha --exit --require ts-node/register --require source-map-support/register "src/tools/mocha/*.test.ts"
```

The tests run a real Worker against `TestWorkflowEnvironment`, driving `weatherAgent` end to end against a scripted model double. One takes the happy path: the model asks for `getWeather`, the Activity runs exactly once, and its result comes back on the next model turn. The other fails that Activity and asserts the failure reaches the model as the tool's response and the agent answers from it. No `GEMINI_API_KEY` is required.
