# OpenAI Agents: Handoffs

Demonstrates agent handoffs with the Temporal OpenAI Agents integration. A triage agent routes
each request to one of two specialist agents (billing, support), running durably as a Temporal
Workflow.

Scenarios (`src/handoffs/workflows.ts`):

- **agent-handoffs** — handoffs declared as a plain `Agent[]`.
- **handoff-function** — handoffs declared with the `handoff()` form.
- **handoff-with-filter** — a per-handoff `inputFilter` that strips the current turn's items
  (the handoff `function_call_result`) before the specialist runs.

## Run

Run these from the `openai-agents/` root (run `npm install` there once first).

```bash
# In one terminal, start the Worker (requires a local Temporal server and OPENAI_API_KEY):
OPENAI_API_KEY=sk-... npx ts-node src/handoffs/worker.ts

# In another terminal, start a scenario:
npx ts-node src/handoffs/client.ts agent-handoffs
npx ts-node src/handoffs/client.ts handoff-function
npx ts-node src/handoffs/client.ts handoff-with-filter
```

## Test

```bash
npx mocha --exit --require ts-node/register --require source-map-support/register "src/handoffs/mocha/*.test.ts"
```

Tests run a real Worker against `TestWorkflowEnvironment` with a scripted fake model, so no
`OPENAI_API_KEY` is required. They assert that triage transfers to the correct specialist and that
the input filter removes the handoff tool result from the specialist's model input.
