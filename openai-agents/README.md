# OpenAI Agents

These samples use the `@temporalio/openai-agents` integration to run [OpenAI Agents SDK](https://github.com/openai/openai-agents-js) agents as Temporal Workflows. Agent orchestration — the agent loop, handoffs, tool calls, and guardrails — runs inside the Workflow, while model calls run as durable Activities, so they retry on failure and are not repeated during Workflow replay.

Each subdirectory is a standalone sample with its own `package.json` and README. The integration package itself is documented in the [`@temporalio/openai-agents` README](https://github.com/temporalio/sdk-typescript/tree/main/packages/openai-agents).

## Prerequisites

These apply to every sample in this directory:

- A running Temporal dev server: `temporal server start-dev`.
- Node 22 or later.
- An OpenAI API key: `export OPENAI_API_KEY=...`.
- Dependencies installed in the sample directory: `npm install`.

Each sample's README describes how to start its Worker and run its scenarios.

## Samples

| Sample                                      | Demonstrates                                                                                                                              |
| :------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------- |
| [`basic`](./basic)                          | A single agent plus the core building blocks: Activity-backed and inline tools, local-Activity tools, agent context, structured output, per-run model override, and dynamic instructions. |
| [`handoffs`](./handoffs)                    | A triage agent routes each request to a specialist agent, using both the `Agent[]` and `handoff()` forms and a per-handoff input filter. |
| [`agent-patterns`](./agent-patterns)        | Multi-agent orchestration patterns: deterministic chaining, parallelization, LLM-as-judge, agents-as-tools, and input/output guardrails. |
| [`sessions`](./sessions)                    | Conversation history with `WorkflowSafeMemorySession`, including carrying history across a `continueAsNew` boundary.                     |
| [`human-approval`](./human-approval)        | A human-in-the-loop tool that pauses the run for an `approve` Signal, then resumes by serializing and rehydrating the run state across `continueAsNew`. |
| [`tools`](./tools)                          | Server-side hosted tools — web search, image generation, and code interpreter — executed by the model provider during the model Activity. |
| [`tracing`](./tracing)                      | The three supported tracing paths: a custom `TracingProcessor`, the OpenAI hosted exporter, and OpenTelemetry, plus `temporal:*` orchestration spans. |
| [`model-providers`](./model-providers)      | Pass a custom `ModelProvider` to point an agent at any OpenAI-compatible endpoint.                                                       |
| [`reasoning-content`](./reasoning-content)  | Read a reasoning model's `reasoning_content` field by calling the `openai` SDK directly from an Activity.                                |
| [`mcp`](./mcp)                              | Stateless and stateful Model Context Protocol servers (stdio, Streamable HTTP, SSE, and prompt servers) running locally.                 |
| [`hosted-mcp`](./hosted-mcp)                | A `HostedMCPTool` the model calls server-side, with and without a Signal-driven approval round trip.                                     |
| [`research-bot`](./research-bot)            | A planner agent fans out concurrent web searches and a writer agent synthesizes a final report.                                         |
| [`customer-service`](./customer-service)    | A long-running, multi-turn Workflow driven by Updates and Queries, with triage handoffs and `continueAsNew` to bound history.           |
| [`nexus-tools`](./nexus-tools)              | Expose a [Nexus](https://docs.temporal.io/nexus) Operation as an agent tool with `nexusOperationAsTool`.                                 |

## Feature support

Any OpenAI Agents SDK `ModelProvider` can drive the model Activity. The provider runs in the Activity, never inside the Workflow sandbox.

| Feature                 | Status        | Notes                                                                                   |
| :---------------------- | :------------ | :-------------------------------------------------------------------------------------- |
| Multi-turn agents       | Supported     | Agent loop runs durably in the Workflow                                                 |
| Handoffs                | Supported     | `Agent` and `handoff()` forms                                                           |
| Inline function tools   | Supported     | Must be deterministic                                                                   |
| Activity-backed tools   | Supported     | Via `activityAsTool()`                                                                  |
| Nexus operation tools   | Supported     | Via `nexusOperationAsTool()`                                                            |
| Nested agent tools      | Supported     | Via `agentAsTool()`                                                                     |
| Hosted tools            | Supported     | Executed server-side by the model provider                                              |
| Stateless MCP servers   | Supported     | Via `StatelessMCPServerProvider` and `statelessMcpServer()`                             |
| Stateful MCP servers    | Supported     | Via `StatefulMCPServerProvider` and `statefulMcpServer()`                               |
| Sessions                | Supported     | Via `WorkflowSafeMemorySession`; upstream `MemorySession` is rejected                   |
| Run state and approvals | Supported     | Serialize with `result.state.toString()` and rehydrate with `RunState.fromString`       |
| Guardrails              | Supported     | Guardrail callbacks must be deterministic                                               |
| Tracing                 | Supported     | OpenAI hosted traces, custom `TracingProcessor`s, OTel, and optional `temporal:*` spans |
| Agent context           | Supported     | Activity tools receive a copy                                                           |
| `continueAsNew`         | Supported     | Plugin config propagates to the continuation                                            |
| Child Workflows         | Supported     | Plugin config propagates to children                                                    |
| Local Activities        | Supported     | Set `useLocalActivity: true` in `modelParams`                                           |
| Model override per run  | Supported     | `runConfig.model` accepts a string model name                                           |
| Streaming               | Not supported | Use `runner.run()`                                                                      |
| Voice agents            | Not supported |                                                                                         |
