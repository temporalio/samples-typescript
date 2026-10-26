# Google ADK Agents

These samples use the `@temporalio/google-adk` integration to run [Google Agent Development Kit](https://github.com/google/adk-js) (`@google/adk`) agents as durable Temporal Workflows. The ADK agent graph — the `Runner` loop, `LlmAgent`s, tools, and MCP toolsets — runs inside the Workflow and replays deterministically, while its non-deterministic I/O — model calls, MCP tool calls, and Activities exposed as tools — runs as durable Activities, so they retry on failure and are not repeated during Workflow replay.

This is a single project: one `package.json` and one set of configs at the `google-adk/` root, with each scenario in its own subdirectory under `src/`. Run `npm install` once here, then run any scenario by path (see each scenario's README). The integration package itself is documented in the [`@temporalio/google-adk` README](https://github.com/temporalio/ai-integrations/tree/main/typescript/google-adk).

## Prerequisites

These apply to every sample in this directory:

- A running Temporal dev server: `temporal server start-dev`.
- Node.js 22.12.0 or later.
- A Gemini API key for live runs: `export GEMINI_API_KEY=...`. Each scenario also documents a credential-free local mode.
- Dependencies installed once at the `google-adk/` root: `npm install`.

Each scenario's README describes how to start its Worker and run its scenarios by path.

## Samples

| Sample                                         | Demonstrates                                                                                                                    |
| :--------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------ |
| [`agent-chat`](./src/agent-chat)               | Multi-turn chat through Updates, inspectable state through a Query, and Continue-As-New with conversation history.              |
| [`tools`](./src/tools)                         | An existing Temporal Activity exposed to the agent as an ADK tool via `activityAsTool`.                                         |
| [`multi-agent`](./src/multi-agent)             | A `transfer_to_agent` relay from a coordinator `LlmAgent` through a researcher and a writer, each with its own `TemporalModel`. |
| [`mcp`](./src/mcp)                             | A `TemporalMCPToolset` backed by an `mcpToolsets` factory on the plugin (a filesystem MCP server over stdio).                   |
| [`streaming`](./src/streaming)                 | Token streaming from a direct `TemporalModel` call — no agent loop — over the Workflow streams API.                             |
| [`human-in-the-loop`](./src/human-in-the-loop) | A `LongRunningFunctionTool` whose completion is gated by a Temporal Signal or Update.                                           |
| [`structured-output`](./src/structured-output) | An agent constrained by an output schema, with validation at the Workflow boundary.                                             |
| [`observability`](./src/observability)         | Token usage, latency, and call counts, by composing `OpenTelemetryPlugin` onto the Worker alongside `GoogleAdkPlugin`.          |

ADK code executors are not included because the integration does not provide a durable Activity boundary for sandbox execution.
