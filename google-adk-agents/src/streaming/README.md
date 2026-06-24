# Google ADK Agents: Streaming

Token streaming over a Workflow Stream. Unlike the agent scenarios, the Workflow here calls a `TemporalModel` directly — no `LlmAgent`, no `Runner` — so the streaming path stands on its own.

Streaming is requested by `generateContentAsync`'s `stream` argument, not by configuration; a streaming call additionally needs a `streamingTopic` on the `TemporalModel` to publish to, and fails without one. Together they route the call to an `adk-invokeModelStreaming` Activity, which publishes every `LlmResponse` the model yields to that topic via the Workflow streams API while still returning the same ordered sequence to the Workflow — the deterministic, replay-safe channel. Deltas arrive as `partial` responses and the turn ends with one non-partial response carrying its whole text; the Workflow returns that text and a count of the deltas.

The Workflow hosts the [Workflow Stream](https://github.com/temporalio/sdk-typescript/tree/main/contrib/workflow-streams) with `new WorkflowStream()` and, once the model turn is done, waits up to 10 seconds for a `consumer-done` Signal before returning — completing would discard the log out from under a subscriber's final poll, and the bound keeps the Workflow from hanging when nobody is subscribed. The client subscribes to the topic from outside with `WorkflowStreamClient.create(client, workflowId).topic(streamingTopic).subscribe()`, prints each delta's text as it arrives, and stops at the non-partial response, at which point it Signals the Workflow.

## Run

Run these from the `google-adk-agents/` root (run `npm install` there once first).

```bash
# In one terminal, start the Worker (requires a local Temporal server and GEMINI_API_KEY):
GEMINI_API_KEY=... npx ts-node src/streaming/worker.ts

# In another terminal, run the scenario:
npx ts-node src/streaming/client.ts
```

The story prints token by token as the model produces it. In the Temporal UI the history shows a single `adk-invokeModelStreaming` Activity.

## Test

```bash
npx mocha --exit --require ts-node/register --require source-map-support/register "src/streaming/mocha/*.test.ts"
```

The test runs a real Worker against `TestWorkflowEnvironment` with a `BaseLlm` double scripted as a real text turn — three `partial` deltas then the non-partial whole-turn response. The double holds each response back until an external subscriber has taken the one before it, so the deltas reach the subscriber while the model call is still in flight. It asserts the subscriber receives all four in order, and that the Workflow returns the turn's text once and a count of three chunks. No `GEMINI_API_KEY` is required.
