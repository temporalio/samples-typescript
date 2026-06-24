# openai-agents/hosted-mcp

Demonstrates using a `HostedMCPTool` from the OpenAI Agents SDK inside a Temporal Workflow with the
`@temporalio/openai-agents` plugin. A hosted MCP tool is executed server-side by the model: the
model itself calls the remote hosted MCP server during a model request, so there is no local MCP
server to run.

Two workflows are included:

- **simple** — an agent carrying a `hostedMcpTool` with `requireApproval: 'never'`. The model is
  free to call the hosted MCP server without any approval round trip.
- **approval** — an agent carrying a `hostedMcpTool` with `requireApproval: 'always'`. Approval is
  driven by a Temporal Signal (`approvalDecision`, carrying a boolean). The Workflow waits for the
  Signal before running the agent, and the tool's `onApproval` callback resolves approve/reject from
  the signaled decision.

The runnable sample points at the public [GitMCP](https://gitmcp.io) hosted MCP server
(`serverLabel: 'gitmcp'`, `serverUrl: 'https://gitmcp.io/openai/codex'`).

## Live-only requirement

Running the worker and client makes real model calls against OpenAI, and the model in turn calls the
public GitMCP server. This sample therefore requires:

- A real `OPENAI_API_KEY` environment variable.
- Outbound network access to OpenAI and to `https://gitmcp.io`.

The included tests do not exercise any of this. They use a fake model provider, make no network
calls, and assert wiring/completion only (that the agent carries the hosted MCP tool and the
Workflow runs to completion).

## Run

1. Start a Temporal dev server:

   ```sh
   temporal server start-dev
   ```

2. In another terminal, start the worker (run from the `openai-agents/` root, after `npm install` there):

   ```sh
   export OPENAI_API_KEY=sk-...
   npx ts-node src/hosted-mcp/worker.ts
   ```

3. In a third terminal, run a workflow:

   ```sh
   export OPENAI_API_KEY=sk-...
   npx ts-node src/hosted-mcp/client.ts simple
   npx ts-node src/hosted-mcp/client.ts approval
   ```

The `approval` client starts the Workflow and then sends the `approvalDecision` Signal with `true`
so the demo completes.
