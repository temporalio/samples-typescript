# Google ADK Agents

These samples use the `@temporalio/google-adk-agents` integration to run [Google Agent Development Kit](https://github.com/google/adk-js) (`@google/adk`) agents as durable Temporal Workflows. The ADK agent graph — the `Runner` loop, `LlmAgent`s, tools, and MCP toolsets — runs inside the Workflow and replays deterministically, while the non-deterministic I/O boundaries (every model call and every MCP tool call) run as durable Activities, so they retry on failure and are not repeated during Workflow replay.

This is a single project: one `package.json` and one set of configs at the `google-adk-agents/` root, with each scenario in its own subdirectory. Run `npm install` once here, then run any scenario by path (see each scenario's README). The integration package itself is documented in the [`@temporalio/google-adk-agents` README](https://github.com/temporalio/sdk-typescript/tree/main/contrib/google-adk-agents).

## Prerequisites

These apply to every sample in this directory:

- A running Temporal dev server: `temporal server start-dev`.
- Node 22 or later.
- A Gemini API key for live runs: `export GOOGLE_API_KEY=...`.
- Dependencies installed once at the `google-adk-agents/` root: `npm install`.

Each scenario's README describes how to start its Worker and run its scenarios by path.

## Samples

| Sample                               | Demonstrates                                                                                                  |
| :----------------------------------- | :------------------------------------------------------------------------------------------------------------ |
| [`basic`](./basic)                   | A single `LlmAgent` whose model is a `TemporalModel`, driven by `InMemoryRunner` for one durable model call.  |
| [`tools`](./tools)                   | An existing Temporal Activity exposed to the agent as an ADK tool via `activityAsTool`.                       |
| [`agent-patterns`](./agent-patterns) | A coordinator `LlmAgent` that delegates to sub-agents, each with its own `TemporalModel`.                     |
| [`mcp`](./mcp)                       | A `TemporalMcpToolSet` backed by an `mcpToolsets` factory on the plugin (a filesystem MCP server over stdio). |
| [`streaming`](./streaming)           | Token streaming via `TemporalModel` `streamingTopic` and the Workflow streams API.                            |
| [`human-approval`](./human-approval) | A `LongRunningFunctionTool` whose completion is gated by a Temporal Signal or Update.                         |
