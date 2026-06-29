# OpenAI Agents: Streaming

Demonstrates the streaming API of the Temporal OpenAI Agents integration. The Workflow hosts a
[Workflow Stream](https://github.com/temporalio/sdk-typescript/tree/main/contrib/workflow-streams)
and runs an agent in streaming mode with `runner.run(agent, input, { stream: true })`. As the model
responds, the streaming model Activity publishes each raw model stream event to the Workflow Stream
topic, and an external client subscribes to that topic to print the deltas live.

The Workflow (`src/streaming/workflows.ts`) constructs `new WorkflowStream()` at the top, then
iterates the `StreamedRunResult` to drive the run to completion and returns the final text. The
Worker configures `modelParams.streamingTopic` (and a `streamingBatchInterval`) on the
`OpenAIAgentsPlugin` so the streaming Activity knows which topic to publish to. The client
(`src/streaming/client.ts`) subscribes from outside the Workflow with
`WorkflowStreamClient.create(client, workflowId).topic(streamingTopic).subscribe()`.

## Run

Run these from the `openai-agents/` root (run `npm install` there once first).

```bash
# In one terminal, start the Worker (requires a local Temporal server and OPENAI_API_KEY):
OPENAI_API_KEY=sk-... npx ts-node src/streaming/worker.ts

# In another terminal, start the streaming client:
npx ts-node src/streaming/client.ts
```

## Test

```bash
npx mocha --exit --require ts-node/register --require source-map-support/register "src/streaming/mocha/*.test.ts"
```

The test runs a real Worker against `TestWorkflowEnvironment` with a scripted streaming fake model,
so no `OPENAI_API_KEY` is required. It asserts that an external `WorkflowStreamClient` subscriber
receives the streamed events in order and that the Workflow completes with the final text.
