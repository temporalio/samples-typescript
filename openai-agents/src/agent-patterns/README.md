# OpenAI Agents: Agent Patterns

Demonstrates common multi-agent orchestration patterns with the Temporal OpenAI Agents
integration. Each pattern is its own Workflow in `src/agent-patterns/workflows.ts`.

Scenarios:

- **deterministic** — three agents run in sequence, each gating the next (outline → draft → polish).
- **parallelization** — `Promise.all` fans out to three agents, then a judge agent picks the best answer.
- **llm-as-judge** — a generate→judge loop that retries until the judge approves.
- **agents-as-tools** — an orchestrator uses `agentAsTool` to call a specialist agent as a tool.
- **input-guardrails** — `runConfig.inputGuardrails` blocks forbidden input before the model runs.
- **output-guardrails** — `runConfig.outputGuardrails` blocks unsafe model output after the model runs.

## Run

Run these from the `openai-agents/` root (run `npm install` there once first).

```bash
# In one terminal, start the Worker (requires a local Temporal server and OPENAI_API_KEY):
OPENAI_API_KEY=sk-... npx ts-node src/agent-patterns/worker.ts

# In another terminal, start a scenario:
npx ts-node src/agent-patterns/client.ts deterministic
npx ts-node src/agent-patterns/client.ts parallelization
npx ts-node src/agent-patterns/client.ts llm-as-judge
npx ts-node src/agent-patterns/client.ts agents-as-tools
npx ts-node src/agent-patterns/client.ts input-guardrails
npx ts-node src/agent-patterns/client.ts output-guardrails
```

## Test

```bash
npx mocha --exit --require ts-node/register --require source-map-support/register "src/agent-patterns/mocha/*.test.ts"
```

Tests run a real Worker against `TestWorkflowEnvironment` with a scripted fake model, so no
`OPENAI_API_KEY` is required. Each pattern has a test asserting its mechanism (call counts,
history threading, tool round-trips, and guardrail tripwires).
