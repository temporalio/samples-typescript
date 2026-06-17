# OpenAI Agents: Nexus Tools

Exposes a [Nexus](https://docs.temporal.io/nexus) Operation as an agent tool with
`@temporalio/openai-agents`. The agent answers weather questions by calling a `weather.getWeather`
Nexus Operation through `nexusOperationAsTool`; the Workflow runs the Operation and feeds the result
back to the agent.

The package defines:

- a `nexus-rpc` weather service (`src/api.ts`),
- a synchronous service handler (`src/handler.ts`), registered on the Worker via `nexusServices`,
- a Workflow whose agent uses `nexusOperationAsTool` (`src/workflows.ts`).

## Run

Start the Temporal dev server:

```
temporal server start-dev
```

Set your OpenAI key and start the Worker (run from the `openai-agents/` root, after `npm install` there):

```
export OPENAI_API_KEY=sk-...
npx ts-node nexus-tools/src/worker.ts
```

In another shell, run the Workflow. The client creates the Nexus endpoint if needed, then starts the
Workflow (optionally pass a prompt):

```
npx ts-node nexus-tools/src/client.ts "What is the weather in Tokyo?"
```

## Test

```
npx mocha --exit --require ts-node/register --require source-map-support/register "nexus-tools/src/mocha/*.test.ts"
```

The test uses `TestWorkflowEnvironment`, `env.createNexusEndpoint(...)`, a real Worker, and a
`FakeModelProvider`, so it runs without an API key. It asserts the Nexus operation result reaches the
model.
