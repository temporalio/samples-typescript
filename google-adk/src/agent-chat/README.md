# Agent chat

This sample accepts messages through a Workflow Update, exposes conversation history through a Query, and carries that history across Continue-As-New runs.

Start a live Worker with `GEMINI_API_KEY=... npx ts-node src/agent-chat/worker.ts` or a credential-free Worker with `MODEL_PROVIDER=fake npx ts-node src/agent-chat/worker.ts`.

Run `npx ts-node src/agent-chat/client.ts`. Enter `/history` to query state and `/quit` to stop.

Run its API-key-free test with:

```sh
npx mocha --exit --require ts-node/register --require source-map-support/register "src/agent-chat/mocha/*.test.ts"
```
