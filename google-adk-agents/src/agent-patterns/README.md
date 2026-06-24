# Google ADK Agents: Agent Patterns

A relay of three `LlmAgent`s over ADK's built-in `transfer_to_agent` tool, all of it running durably inside the Workflow: a coordinator transfers to a researcher, and the researcher transfers on to a writer, which produces the final answer.

Each agent's `TemporalModel` sets a `summary` — the label the Temporal UI puts on that turn's `adk-invokeModel` Activity.

## Run

Run these from the `google-adk-agents/` root (run `npm install` there once first).

```bash
# In one terminal, start the Worker (requires a local Temporal server and GEMINI_API_KEY):
GEMINI_API_KEY=... npx ts-node src/agent-patterns/worker.ts

# In another terminal, run the scenario:
npx ts-node src/agent-patterns/client.ts
```

## Test

```bash
npx mocha --exit --require ts-node/register --require source-map-support/register "src/agent-patterns/mocha/*.test.ts"
```

The test runs a real Worker against `TestWorkflowEnvironment` with a scripted `BaseLlm` double of its own, which answers each turn according to the agent ADK names as the asker: a transfer for the coordinator and the researcher, the haiku for the writer. No `GEMINI_API_KEY` is required.
