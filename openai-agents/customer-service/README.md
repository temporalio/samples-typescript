# OpenAI Agents: Customer Service

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

Set your OpenAI key and start the Worker:

```
export OPENAI_API_KEY=sk-...
npm run start
```

In another shell, start the interactive chat client:

```
npm run workflow
```

Type messages to chat. Type `history` to print the transcript, or `exit` to quit.

## Test

```
npm test
```

The test uses `TestWorkflowEnvironment`, a real Worker, and a `FakeModelProvider`, so it runs without
an API key. It drives two Updates, asserts a handoff occurred, and reads the transcript via Query.
