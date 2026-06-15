# OpenAI Agents: Handoffs

Demonstrates agent handoffs with the Temporal OpenAI Agents integration. A triage agent routes
each request to one of two specialist agents (billing, support), running durably as a Temporal
Workflow.

Scenarios (`src/workflows.ts`):

- **agent-handoffs** — handoffs declared as a plain `Agent[]`.
- **handoff-function** — handoffs declared with the `handoff()` form.
- **handoff-with-filter** — a per-handoff `inputFilter` that strips the current turn's items
  (the handoff `function_call_result`) before the specialist runs.

## Run

```bash
npm install
npm run build

# In one terminal, start the Worker (requires a local Temporal server and OPENAI_API_KEY):
OPENAI_API_KEY=sk-... npm start

# In another terminal, start a scenario:
npm run workflow agent-handoffs
npm run workflow handoff-function
npm run workflow handoff-with-filter
```

## Test

```bash
npm test
```

Tests run a real Worker against `TestWorkflowEnvironment` with a scripted fake model, so no
`OPENAI_API_KEY` is required. They assert that triage transfers to the correct specialist and that
the input filter removes the handoff tool result from the specialist's model input.
