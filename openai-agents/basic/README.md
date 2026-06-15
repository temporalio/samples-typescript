# OpenAI Agents: Basic

Demonstrates the building blocks of the Temporal OpenAI Agents integration: a single agent, the
different ways to give it tools, run context, structured output, per-run model overrides, and
dynamic instructions — each running durably as a Temporal Workflow.

Scenarios (`src/workflows.ts`):

- **hello-world** — a single agent that returns model text, with no tools.
- **tools** — an Activity-backed tool wired in with `activityAsTool` (getWeather).
- **inline-tool** — an inline deterministic `tool()` that runs inside the Workflow (adds two numbers).
- **local-activity-tool** — a tool backed by a local Activity via `proxyLocalActivities` (getHeadlines).
- **agent-context** — a tool reads `runContext.context` (the userId) and that value reaches the model.
- **structured-output** — an agent with a zod `outputType` that returns a typed object.
- **model-override** — `runConfig.model` overrides the model for a single run.
- **dynamic-instructions** — instructions computed from `runContext.context` (userName and style).

## Run

```bash
npm install
npm run build

# In one terminal, start the Worker (requires a local Temporal server and OPENAI_API_KEY):
OPENAI_API_KEY=sk-... npm start

# In another terminal, start a scenario:
npm run workflow hello-world
npm run workflow tools
npm run workflow structured-output
```

## Test

```bash
npm test
```

Tests run a real Worker against `TestWorkflowEnvironment` with a scripted fake model, so no
`OPENAI_API_KEY` is required. They assert each scenario's mechanism — that tools are invoked, that
context reaches the model, that structured output is typed, and that the model override and dynamic
instructions take effect.
