# OpenAI Agents: Human Approval

Demonstrates a human-in-the-loop approval flow with the Temporal OpenAI Agents integration. A tool
marked `needsApproval` pauses the agent run with an interruption; the Workflow waits for an
`approve` Signal, then resumes by serializing and rehydrating the run state across `continueAsNew`.

Flow (`src/workflows.ts`):

1. The agent requests a `dangerousAction` tool call; because the tool sets `needsApproval`, the run
   returns with `result.interruptions`.
2. The Workflow waits for the `approve` Signal.
3. On approval it continues as new with `resumeFromRunState: result.state.toString()`.
4. The resumed run rehydrates with `RunState.fromString`, calls `state.approve` for each
   interruption, and re-runs to completion.

## Run

```bash
npm install
npm run build

# In one terminal, start the Worker (requires a local Temporal server and OPENAI_API_KEY):
OPENAI_API_KEY=sk-... npm start

# In another terminal, start the workflow (the client sends the approval Signal):
npm run workflow
```

## Test

```bash
npm test
```

The test runs a real Worker against `TestWorkflowEnvironment` with a scripted fake model, so no
`OPENAI_API_KEY` is required. It scripts a `dangerousAction` tool call to produce an interruption,
drives the `approve` Signal, and asserts the resumed run completes.
