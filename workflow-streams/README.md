# Workflow Streams

> **Experimental.** These samples use `@temporalio/workflow-streams`, which is
> currently distributed on the `contrib/pubsub` branch of `sdk-typescript`. The
> module is experimental and its API may change.

`@temporalio/workflow-streams` lets a workflow host a durable,
offset-addressed event channel. The workflow holds an append-only log;
external clients (activities, starters, web backends) publish to topics via
signals and subscribe via long-poll updates. This packages the
boilerplate — batching, offset tracking, topic filtering, continue-as-new
hand-off — into a reusable stream.

The package has no root entrypoint; import from the two subpaths instead:

- `@temporalio/workflow-streams/workflow` — workflow-safe surface
  (`WorkflowStream`, `WorkflowStreamState`, …). Safe to bundle into workflow
  code.
- `@temporalio/workflow-streams/client` — client surface
  (`WorkflowStreamClient`, …). Pulls in `crypto` and `@temporalio/client`; do
  not import from a workflow file.

This sample has five scenarios. All of them share one worker except LLM
streaming, which has its own worker because it needs the `openai` package and
an `OPENAI_API_KEY`.

**Basic publish/subscribe with heterogeneous topics:**

- `src/workflows.ts` (`order`) — a workflow that hosts a `WorkflowStream` and
  publishes status events as it processes an order.
- `src/activities.ts` (`chargeCard`) — an activity that publishes intermediate
  progress to the stream via `WorkflowStreamClient.fromWithinActivity()`.
- `src/run-publisher.ts` — starts the workflow, subscribes to both topics,
  decodes each by `item.topic`, and prints events as they arrive.

**Reconnecting subscriber:**

- `src/workflows.ts` (`pipeline`) — a multi-stage pipeline that publishes
  stage transitions over ~10 seconds, leaving room for a consumer to
  disconnect and reconnect mid-run.
- `src/run-reconnecting-subscriber.ts` — connects, reads a couple of events,
  "disconnects," then reopens a fresh client and resumes via
  `subscribe(fromOffset)`. This is the central Workflow Streams use case: a
  consumer can disappear (page refresh, server restart, laptop closed) and
  resume later without missing events or seeing duplicates.

**External (non-Activity) publisher:**

- `src/workflows.ts` (`hub`) — a passive workflow that does no work of its
  own; it exists only to host a `WorkflowStream` and shut down when signaled.
- `src/run-external-publisher.ts` — starts the hub, then publishes events
  into it from a plain Node async function using
  `WorkflowStreamClient.create(client, workflowId)`. A subscriber runs
  alongside; when the publisher is done it emits a sentinel event and signals
  `close`. The shape that fits a backend service or scheduled job pushing
  events into a workflow it didn't itself start.

**Bounded log via `truncate()`:**

- `src/workflows.ts` (`ticker`) — a long-running workflow that publishes
  events at a fixed cadence and calls `stream.truncate(...)` periodically to
  bound log growth, keeping only the most recent N entries.
- `src/run-truncating-ticker.ts` — runs a fast subscriber and a slow
  subscriber side by side. The fast one keeps up and sees every offset in
  order; the slow one falls behind a truncation and silently jumps forward to
  the new base offset. The output makes the trade visible: bounded log size
  in exchange for intermediate events being invisible to slow consumers.

**LLM streaming:**

- `src/llm-workflows.ts` (`llmStreaming`) — hosts a `WorkflowStream` and runs
  `streamCompletion` as a single activity. The workflow itself does no
  streaming; the activity owns the non-deterministic OpenAI call.
- `src/llm-activities.ts` (`streamCompletion`) — calls
  `openai.chat.completions.create({ stream: true })`, publishes each token
  chunk on the `delta` topic, the final accumulated text on `complete`, and a
  `RetryEvent` on `retry` when running on attempt > 1.
- `src/run-llm.ts` — subscribes to all three topics, renders deltas to the
  terminal as they arrive, and on a `retry` event uses ANSI escapes to rewind
  the printed output before the retried attempt re-publishes.

The LLM streaming scenario runs on its own worker (`src/llm-worker.ts`, on
`workflow-stream-llm-task-queue`) because it needs the `openai` dependency
and an `OPENAI_API_KEY`, and because killing this worker mid-stream is the
easiest way to demonstrate retry handling without disrupting the other four
scenarios.

## Run it

1. `temporal server start-dev` to start [Temporal
   Server](https://github.com/temporalio/cli/#installation).
2. `npm install` to install dependencies.

For all scenarios except LLM streaming, start the shared worker:

```bash
npm run start
```

For LLM streaming, export the API key and start the LLM worker:

```bash
export OPENAI_API_KEY=...
npm run start.llm
```

Then in another terminal, pick a scenario:

```bash
npm run workflow.publisher       # basic publish/subscribe
npm run workflow.reconnecting    # reconnecting subscriber
npm run workflow.external        # external publisher
npm run workflow.ticker          # bounded log
npm run workflow.llm             # LLM streaming
```

To exercise the LLM streaming retry path, kill the LLM worker (Ctrl-C) while
output is streaming and start it again. The activity's next attempt sends a
retry event first; the consumer clears its on-screen output via ANSI escapes
and re-renders from scratch.
