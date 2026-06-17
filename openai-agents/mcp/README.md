# openai-agents/mcp

Demonstrates stateless and stateful MCP (Model Context Protocol) servers used by a Temporal-backed
OpenAI agent through the `@temporalio/openai-agents` plugin. Every MCP server in this sample is
bundled and runs locally — either in-process or as a localhost/subprocess server the sample starts
itself — so no external MCP service is required.

Five scenarios are included:

- `filesystem` — stateless MCP over stdio; a bundled stdio server (`src/servers/filesystem-server.ts`)
  exposes `listFiles`/`readFile` over `src/servers/sample-files/`.
- `streamable-http` — stateless MCP over a localhost Streamable-HTTP server (`src/servers/tools-server.ts`)
  with `add`/`getWeather`/`getSecret` tools.
- `sse` — stateless MCP over a localhost SSE server (`src/servers/sse-server.ts`) with the same tools.
- `prompt-server` — stateless MCP server (`src/servers/prompt-server.ts`) exposing a `summarize`
  prompt; the workflow fetches the prompt and uses it as the agent's instructions.
- `stateful-memory` — a `StatefulMCPServerProvider` notes server (`src/servers/notes-server.ts`) with
  `saveNote`/`listNotes`/`readNote`; the workflow calls `connect()`/`cleanup()` to keep server state
  for the run.

The worker requires `OPENAI_API_KEY`. The included tests use a fake model provider, make zero external
network calls, and drive the bundled MCP servers locally to assert that tool results flow back.

## Run

1. Start a Temporal dev server:

   ```sh
   temporal server start-dev
   ```

2. In another terminal, start the worker (run from the `openai-agents/` root, after `npm install` there):

   ```sh
   export OPENAI_API_KEY=sk-...
   npx ts-node mcp/src/worker.ts
   ```

3. In a third terminal, run a workflow:

   ```sh
   npx ts-node mcp/src/client.ts filesystem
   npx ts-node mcp/src/client.ts streamable-http
   npx ts-node mcp/src/client.ts sse
   npx ts-node mcp/src/client.ts prompt-server
   npx ts-node mcp/src/client.ts stateful-memory
   ```
