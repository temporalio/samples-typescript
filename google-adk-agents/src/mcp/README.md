# Google ADK Agents: MCP

A `TemporalMCPToolset` backed by a real [Model Context Protocol](https://modelcontextprotocol.io) server. The agent declares `new TemporalMCPToolset({ name: 'filesystem' })`; the Worker registers the matching `filesystem` factory on the plugin via `mcpToolsets`, which opens a filesystem MCP server over stdio (`@modelcontextprotocol/server-filesystem`). Tool discovery and every tool call route through `filesystem-listTools` / `filesystem-callTool` Activities, so the MCP connection details stay on the Worker and never enter Workflow inputs.

## Run

Run these from the `google-adk-agents/` root (run `npm install` there once first). The Worker spawns the filesystem MCP server with `npx`, exposing this sample's `src/mcp/sample-files/` directory.

```bash
# In one terminal, start the Worker (requires a local Temporal server and GEMINI_API_KEY):
GEMINI_API_KEY=... npx ts-node src/mcp/worker.ts

# In another terminal, run the scenario:
npx ts-node src/mcp/client.ts
```

## Test

```bash
npx mocha --exit --require ts-node/register --require source-map-support/register "src/mcp/mocha/*.test.ts"
```

The test registers an in-memory `mockMCPToolset` on the plugin under the same `filesystem` name — no MCP server subprocess, no `npx`, no network, and no `GEMINI_API_KEY`. It drives `filesystemAgent` against a scripted model double, so a real tool call crosses the `filesystem-callTool` Activity and its result comes back on the next model turn.
