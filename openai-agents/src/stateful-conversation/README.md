# OpenAI Agents: Stateful Conversation

A stateful, multi-turn customer-service Workflow built with `@temporalio/openai-agents`. It mirrors
the OpenAI Agents SDK airline customer-service sample:

- The Workflow stays running and accepts user messages via an **Update** (`processUserMessage`), each
  returning the agent's reply.
- A **Query** (`getHistory`) returns the running conversation transcript.
- A **Triage** agent hands off to specialist **FAQ** and **SeatBooking** agents; the seat-booking
  handoff seeds a shared `RunContext` with a flight number, and the seat tool updates that context.
- The Workflow calls `continueAsNew` once Temporal suggests it, carrying the conversation state across
  the boundary to bound history growth.

## Run

Start the Temporal dev server:

```
temporal server start-dev
```

Set your OpenAI key and start the Worker (run from the `openai-agents/` root, after `npm install` there):

```
export OPENAI_API_KEY=sk-...
npx ts-node src/stateful-conversation/worker.ts
```

In another shell, start the interactive chat client:

```
npx ts-node src/stateful-conversation/client.ts
```

Type messages to chat. Type `history` to print the transcript, or `exit` to quit.

## Test

```
npx mocha --exit --require ts-node/register --require source-map-support/register "src/stateful-conversation/mocha/*.test.ts"
```

The test uses `TestWorkflowEnvironment`, a real Worker, and a `FakeModelProvider`, so it runs without
an API key. It drives two Updates, asserts a handoff occurred, and reads the transcript via Query.
