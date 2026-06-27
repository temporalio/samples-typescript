# Google ADK Agents: Streaming

Token streaming over SSE. The Workflow drives a `TemporalModel` configured with a `streamingTopic`, so the model call runs as an `invokeModelStreaming` Activity that publishes each incremental `LlmResponse` chunk to the topic via the Workflow streams API, while still returning the full, ordered transcript to the Workflow (the deterministic, replay-safe channel). The Workflow returns the assembled text and the chunk count.

## Run

Run these from the `google-adk-agents/` root (run `npm install` there once first).

```bash
# In one terminal, start the Worker (requires a local Temporal server and GOOGLE_API_KEY):
GOOGLE_API_KEY=... npx ts-node streaming/src/worker.ts

# In another terminal, run the scenario:
npx ts-node streaming/src/client.ts
```

In the Temporal UI the history shows an `invokeModelStreaming` Activity. To consume chunks live as they arrive, subscribe to the `responses` topic with the Workflow streams client.

## Test

```bash
npx mocha --exit --require ts-node/register --require source-map-support/register "streaming/src/mocha/*.test.ts"
```

The test runs a real Worker against `TestWorkflowEnvironment` with `fakeModelProvider` scripted to yield three chunks, asserting the Workflow receives the full transcript and every chunk. No `GOOGLE_API_KEY` is required.
