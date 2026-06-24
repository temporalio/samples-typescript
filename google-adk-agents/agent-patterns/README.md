# Google ADK Agents: Agent Patterns

A coordinator `LlmAgent` that delegates to sub-agents (a researcher and a writer) via ADK's built-in `transfer_to_agent` handoff. Each agent has its own `TemporalModel` with a `summary`, so every model turn shows up as a named Activity in Workflow history. The whole multi-agent handoff runs durably inside the Workflow.

## Run

Run these from the `google-adk-agents/` root (run `npm install` there once first).

```bash
# In one terminal, start the Worker (requires a local Temporal server and GOOGLE_API_KEY):
GOOGLE_API_KEY=... npx ts-node agent-patterns/src/worker.ts

# In another terminal, run the scenario:
npx ts-node agent-patterns/src/client.ts
```

## Test

```bash
npx mocha --exit --require ts-node/register --require source-map-support/register "agent-patterns/src/mocha/*.test.ts"
```

The test runs a real Worker against `TestWorkflowEnvironment` with `fakeModelProvider`, so no `GOOGLE_API_KEY` is required.
