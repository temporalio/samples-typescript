# Google ADK Agents: Human in the Loop

A human-in-the-loop flow. The Workflow body invokes an ADK `LongRunningFunctionTool` whose `execute` blocks on a Temporal `condition` until a human's decision arrives, then returns it. The `approve` Signal and the `approveUpdate` Update each have their own handler; what they share is the variable the tool's `condition` is waiting on, so either one releases it (the Update handler additionally echoes the decision back to its caller).

## Run

Run these from the `google-adk-agents/` root (run `npm install` there once first).

```bash
# In one terminal, start the Worker (requires a local Temporal server):
npx ts-node src/human-in-the-loop/worker.ts

# In another terminal, start the Workflow and send the approval Signal:
temporal workflow start --type humanApproval --task-queue google-adk-human-in-the-loop --workflow-id google-adk-human-in-the-loop-1
temporal workflow signal --workflow-id google-adk-human-in-the-loop-1 --name approve --input '"approved-by-operator"'
```

## Test

```bash
npx mocha --exit --require ts-node/register --require source-map-support/register "src/human-in-the-loop/mocha/*.test.ts"
```

The tests run a real Worker against `TestWorkflowEnvironment`: two release the tool, one through the `approve` Signal and one through the `approveUpdate` Update, asserting it resumes with the supplied value; the third cancels the Workflow and asserts it ends CANCELLED. No `GEMINI_API_KEY` is required.
