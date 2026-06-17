# OpenAI Agents: Sessions

Demonstrates conversation sessions with the Temporal OpenAI Agents integration using
`WorkflowSafeMemorySession`, whose history lives on the Workflow heap and is rebuilt by replay.

Scenarios (`src/workflows.ts`):

- **multi-turn-chat** — runs several prompts over one shared session; later turns see earlier history.
- **carryover-chat** — carries session history across a `continueAsNew` boundary by capturing
  `session.getItems()` and re-seeding the next run via `new WorkflowSafeMemorySession({ initialItems })`.

## Run

Run these from the `openai-agents/` root (run `npm install` there once first).

```bash
# In one terminal, start the Worker (requires a local Temporal server and OPENAI_API_KEY):
OPENAI_API_KEY=sk-... npx ts-node sessions/src/worker.ts

# In another terminal, start a scenario:
npx ts-node sessions/src/client.ts multi-turn-chat
npx ts-node sessions/src/client.ts carryover-chat
```

## Test

```bash
npx mocha --exit --require ts-node/register --require source-map-support/register "sessions/src/mocha/*.test.ts"
```

Tests run a real Worker against `TestWorkflowEnvironment` with a scripted fake model, so no
`OPENAI_API_KEY` is required. They assert that a later turn's model input contains the prior
turn's history — including across the continue-as-new boundary.
