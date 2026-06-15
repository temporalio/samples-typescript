# OpenAI Agents: Agent Patterns

Demonstrates common multi-agent orchestration patterns with the Temporal OpenAI Agents
integration. Each pattern is its own Workflow in `src/workflows.ts`.

Scenarios:

- **deterministic** — three agents run in sequence, each gating the next (outline → draft → polish).
- **parallelization** — `Promise.all` fans out to three agents, then a judge agent picks the best answer.
- **llm-as-judge** — a generate→judge loop that retries until the judge approves.
- **agents-as-tools** — an orchestrator uses `agentAsTool` to call a specialist agent as a tool.
- **input-guardrails** — `runConfig.inputGuardrails` blocks forbidden input before the model runs.
- **output-guardrails** — `runConfig.outputGuardrails` blocks unsafe model output after the model runs.

## Run

```bash
npm install
npm run build

# In one terminal, start the Worker (requires a local Temporal server and OPENAI_API_KEY):
OPENAI_API_KEY=sk-... npm start

# In another terminal, start a scenario:
npm run workflow deterministic
npm run workflow parallelization
npm run workflow llm-as-judge
npm run workflow agents-as-tools
npm run workflow input-guardrails
npm run workflow output-guardrails
```

## Test

```bash
npm test
```

Tests run a real Worker against `TestWorkflowEnvironment` with a scripted fake model, so no
`OPENAI_API_KEY` is required. Each pattern has a test asserting its mechanism (call counts,
history threading, tool round-trips, and guardrail tripwires).
