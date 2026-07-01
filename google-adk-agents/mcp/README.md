# Google ADK Agents: MCP

A `TemporalMcpToolSet` backed by a real [Model Context Protocol](https://modelcontextprotocol.io) server. The agent declares `new TemporalMcpToolSet({ name: 'filesystem' })`; the Worker registers the matching `filesystem` factory on the plugin via `mcpToolsets`, which opens a filesystem MCP server over stdio (`@modelcontextprotocol/server-filesystem`). Tool discovery and every tool call route through `filesystem-listTools` / `filesystem-callTool` Activities, so the MCP connection details stay on the Worker and never enter Workflow inputs.

## Run

Run these from the `google-adk-agents/` root (run `npm install` there once first). The Worker spawns the filesystem MCP server with `npx`, exposing this sample's `src/sample-files/` directory.

```bash
# In one terminal, start the Worker (requires a local Temporal server and GOOGLE_API_KEY):
GOOGLE_API_KEY=... npx ts-node mcp/src/worker.ts

# In another terminal, run the scenario:
npx ts-node mcp/src/client.ts
```

## Test

```bash
npx mocha --exit --require ts-node/register --require source-map-support/register "mcp/src/mocha/*.test.ts"
```

The test registers an in-memory `mockMcpToolset` on the plugin and asserts the `TemporalMcpToolSet` discovers its tools through the named factory — no Node, `npx`, or network required, and no `GOOGLE_API_KEY`.
