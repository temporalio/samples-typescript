# OpenRouter

Call [OpenRouter](https://openrouter.ai/) from a Temporal Activity and fan a prompt batch out, one Activity per prompt. OpenRouter serves hundreds of models from many providers behind one OpenAI-compatible API and one API key, and picks providers and models per request. Temporal handles everything around those calls: retries with backoff, fan-out with bounded concurrency, crash recovery, and a durable per-attempt record of what was called and what it cost.

This is the TypeScript port of the Python [`openrouter/prompt_batch`](https://github.com/temporalio/samples-python/tree/main/openrouter/prompt_batch) sample. The Python repo also has [`budget_gate`](https://github.com/temporalio/samples-python/tree/main/openrouter/budget_gate), a batch that pauses instead of failing when the budget or OpenRouter credits run out.

## What this sample demonstrates

- One Activity per prompt, run concurrently under a fixed number of runners, so a slow or failing prompt never blocks the others.
- OpenRouter's Auto Router (`openrouter/auto`) choosing a model per prompt, with the chosen model and OpenRouter's reported cost returned for each.
- Temporal-owned retries: the `openai` client is created with `maxRetries: 0`; 429 and 5xx retry with backoff and honor `Retry-After`; 4xx errors fail fast and the prompt is reported as skipped instead of failing the batch. OpenRouter can also return HTTP 200 with an `error` body and no `choices`; the Activity checks for that.
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

Total cost: $0.000547
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

`temporal workflow show -w <workflow-id>` shows both attempts. The cache is keyed on your API key and the exact request body, so nothing per-attempt goes in the body. OpenRouter writes the cache shortly after the response completes; a retry that arrives before that write lands is a `MISS` and is billed, which you may see occasionally with the one-second retry interval used here.

## Using OpenRouter's SDKs instead

This sample uses the `openai` package pointed at `https://openrouter.ai/api/v1`, which is the setup OpenRouter documents for OpenAI-compatible clients; OpenRouter-only fields such as `plugins` go in the request body. OpenRouter's own [`@openrouter/sdk`](https://www.npmjs.com/package/@openrouter/sdk) works too (it is ESM-only). If you use it, construct it with `retryConfig: { strategy: 'none' }`: by default it retries 5xx and connection errors for up to an hour, invisibly to Temporal.

For agents built on the [Vercel AI SDK](../ai-sdk), [`@openrouter/ai-sdk-provider`](https://www.npmjs.com/package/@openrouter/ai-sdk-provider) is a drop-in `modelProvider` for `AiSdkPlugin`. For the [OpenAI Agents SDK](../openai-agents/src/model-providers), point the provider's `baseURL` at OpenRouter.

## What Temporal does and does not guarantee

Activities are at-least-once. If a Worker dies mid-call, the retry re-sends the request; within the cache TTL that retry costs nothing, but two identical requests in flight at the same time both miss the cache and both bill. Completed Activities are never re-run, so a restarted batch resumes at the first unfinished prompt.

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
