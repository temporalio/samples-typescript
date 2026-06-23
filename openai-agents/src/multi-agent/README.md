# OpenAI Agents: Multi-Agent

A multi-agent research Workflow built with `@temporalio/openai-agents`. It mirrors the OpenAI Agents
SDK research-bot sample:

- A **planner** agent turns a query into a structured list of web searches (`outputType`).
- The planned searches run **concurrently** in the Workflow via `Promise.all`; each is its own durable
  model call.
- A **writer** agent synthesizes the individual summaries into a final markdown report.

## Run

Start the Temporal dev server:

```
temporal server start-dev
```

Set your OpenAI key and start the Worker (run from the `openai-agents/` root, after `npm install` there):

```
export OPENAI_API_KEY=sk-...
npx ts-node src/multi-agent/worker.ts
```

In another shell, start the Workflow (optionally pass a query):

```
npx ts-node src/multi-agent/client.ts "Caribbean surfing in April"
```

## Test

```
npx mocha --exit --require ts-node/register --require source-map-support/register "src/multi-agent/mocha/*.test.ts"
```

The test uses `TestWorkflowEnvironment`, a real Worker, and a `FakeModelProvider`, so it runs without
an API key.
