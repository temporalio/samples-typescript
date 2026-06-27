# Google ADK Agents: Human Approval

A human-in-the-loop flow. The Workflow body invokes an ADK `LongRunningFunctionTool` whose `execute` blocks on a Temporal `condition` until a human's decision arrives via an `approve` Signal or an `approveUpdate` Update, then returns it — no special shim required. Both the Signal and Update paths drive the same handler.

## Run

Run these from the `google-adk-agents/` root (run `npm install` there once first).

```bash
# In one terminal, start the Worker (requires a local Temporal server):
npx ts-node human-approval/src/worker.ts

# In another terminal, start the Workflow (the client sends the approval Signal):
npx ts-node human-approval/src/client.ts
```

## Test

```bash
npx mocha --exit --require ts-node/register --require source-map-support/register "human-approval/src/mocha/*.test.ts"
```

The test runs a real Worker against `TestWorkflowEnvironment`, driving both the `approve` Signal and the `approveUpdate` Update and asserting the long-running tool resumes with the supplied value. No `GOOGLE_API_KEY` is required.
