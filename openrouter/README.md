# OpenRouter

Call [OpenRouter](https://openrouter.ai/) from a Temporal Activity and fan a prompt batch out, one Activity per prompt. OpenRouter serves hundreds of models from many providers behind one OpenAI-compatible API and one API key, and picks providers and models per request. Temporal handles everything around those calls: retries with backoff, fan-out with bounded concurrency, crash recovery, and a durable record of each prompt's result, cost, and retry history.

This is the TypeScript port of the Python [`openrouter/prompt_batch`](https://github.com/temporalio/samples-python/tree/main/openrouter/prompt_batch) sample. The Python repo also has [`budget_gate`](https://github.com/temporalio/samples-python/tree/main/openrouter/budget_gate), a batch that pauses instead of failing when the budget or OpenRouter credits run out.

## What this sample demonstrates

- One Activity per prompt, run concurrently under a fixed number of runners, so a slow or failing prompt never blocks the others.
- OpenRouter's Auto Router (`openrouter/auto`) choosing a model per prompt, with the chosen model and OpenRouter's reported cost returned for each.
- Temporal-owned retries: the `openai` client is created with `maxRetries: 0`, so every attempt is one HTTP call driven by the Activity retry policy and Event History records the attempt count and last failure; 408, 429, 5xx, and OpenRouter's transient in-flight-budget 402 retry with backoff and honor `Retry-After`; other 4xx errors fail fast and the prompt is reported as skipped instead of failing the batch. Running out of money gets its own failure type, `OpenRouterOutOfCredits`, so a Workflow can pause on it: a 402 for the account or the API key (`error.metadata.limit_source` says which), or the 403 `Key limit exceeded` we have seen a per-key limit return in practice. OpenRouter can also return HTTP 200 with an `error` body and no `choices`, or with a partial answer and an `error` on the choice; the Activity checks for both.
- Retries served from OpenRouter's response cache at $0: the Activity sends `X-OpenRouter-Cache: true`, so if a Worker dies after OpenRouter answered but before Temporal recorded the result, the retried, byte-identical request is a cache hit.
- Heartbeats, so a dead Worker is detected after `heartbeatTimeout` (10s) rather than after the full `startToCloseTimeout`.

## Running this sample

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
2. Set an [OpenRouter API key](https://openrouter.ai/settings/keys) in the Worker's environment. A few cents of credit is enough.
   ```bash
   export OPENROUTER_API_KEY="sk-or-v1-..."
   ```
   Optional: `OPENROUTER_HTTP_REFERER` and `OPENROUTER_APP_TITLE` for [app attribution](https://openrouter.ai/docs/app-attribution).
3. `npm install` to install dependencies.
4. `npm run start.watch` to start the Worker.
5. In another shell, `npm run workflow -- "Explain retries in one sentence." "Write a haiku about databases."` to run the batch.

```
Starting openrouter-prompt-batch-...

[deepseek/deepseek-v4-flash-0731] $0.000022 cache=MISS
  Q: Explain retries in one sentence.
  A: Retries are the automatic re-attempts of a failed operation ...

[deepseek/deepseek-v4-flash-0731] $0.000525 cache=MISS
  Q: Write a haiku about databases.
  A: Columns and table, ...

Reported cost: $0.000547 (what OpenRouter reported on each prompt's final attempt)
Inspect: temporal workflow show -w openrouter-prompt-batch-...
```

### See a retry that costs nothing

`--fail-once` makes each Activity fail its first attempt _after_ OpenRouter has answered, which is what a Worker crash at the wrong moment looks like. The retry re-sends the identical request and OpenRouter serves it from cache:

```bash
npm run workflow -- --fail-once "Explain idempotency in one sentence."
```

```
[deepseek/deepseek-v4-flash-0731] $0.000000 cache=HIT
  Q: Explain idempotency in one sentence.
```

`temporal workflow show -w <workflow-id>` shows the Activity completing on attempt 2 with the simulated failure as its last failure; the Worker log has one line per attempt with model, cost, and cache status. The cache is keyed on your API key and the exact request body, so nothing per-attempt goes in the body. OpenRouter writes the cache shortly after the response completes; a retry that arrives before that write lands is a `MISS` and is billed, which you may see occasionally with the one-second retry interval used here.

### Other options

- `--model <slug>`: any OpenRouter model instead of the Auto Router.
- `--max-concurrency <n>`: how many prompts are in flight at once (default 5).

## Using OpenRouter's SDKs instead

This sample uses the `openai` package pointed at `https://openrouter.ai/api/v1`, which is the setup OpenRouter documents for OpenAI-compatible clients; OpenRouter-only fields such as `plugins` go in the request body. OpenRouter's own [`@openrouter/sdk`](https://www.npmjs.com/package/@openrouter/sdk) works too (it is ESM-only). If you use it, construct it with `retryConfig: { strategy: 'none' }`: by default it retries 5xx and connection errors for up to an hour, invisibly to Temporal.

For agents built on the [Vercel AI SDK](../ai-sdk), [`@openrouter/ai-sdk-provider`](https://www.npmjs.com/package/@openrouter/ai-sdk-provider) is a drop-in `modelProvider` for `AiSdkPlugin`. For the [OpenAI Agents SDK](../openai-agents/src/model-providers), point the provider's `baseURL` at OpenRouter.

## What Temporal does and does not guarantee

Activities are at-least-once. If a Worker dies mid-call, the retry re-sends the request; within the cache TTL that retry costs nothing, but two identical requests in flight at the same time both miss the cache and both bill. Completed Activities are never re-run, so a Worker that restarts mid-batch picks up at the first unfinished prompt.

The reported cost in the result is the sum of what OpenRouter reported on each prompt's final, successful attempt. An attempt that was billed but whose response never made it back to Temporal is not in that number (with `--fail-once`, the first attempt is billed and the result shows the $0 cache hit). For actual spend, use OpenRouter's dashboard or `GET /api/v1/key`. `unknownCostCount` is how many of the results had no cost at all.

Each Activity adds a few events to the Workflow's Event History, and every answer is part of the Workflow result. The sample caps a batch at 100 prompts; for larger batches, use one Workflow per slice or continue-as-new.

## Tests

The tests replace OpenRouter with a fake `fetch` and the Activity with a fake, so they need no API key and make no network calls:

```bash
npm test
```

## Files

| File                                   | Description                                                                                   |
| -------------------------------------- | --------------------------------------------------------------------------------------------- |
| [src/activities.ts](src/activities.ts) | `callOpenRouter`: one HTTP call per attempt, error classification, cache headers, heartbeats. |
| [src/workflows.ts](src/workflows.ts)   | `promptBatch`: bounded fan-out, per-prompt failure handling, retry policy.                    |
| [src/worker.ts](src/worker.ts)         | Builds the OpenRouter client once and runs the Worker.                                        |
| [src/client.ts](src/client.ts)         | Starts a batch and prints answer, model, cost, and cache status per prompt.                   |
| [src/shared.ts](src/shared.ts)         | Types shared by client, Workflow, and Activity.                                               |
