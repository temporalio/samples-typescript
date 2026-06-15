# OpenAI Agents: Research Bot

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

Set your OpenAI key and start the Worker:

```
export OPENAI_API_KEY=sk-...
npm run start
```

In another shell, start the Workflow (optionally pass a query):

```
npm run workflow "Caribbean surfing in April"
```

## Test

```
npm test
```

The test uses `TestWorkflowEnvironment`, a real Worker, and a `FakeModelProvider`, so it runs without
an API key.
