# Strands Agents

A complete set of samples for the Temporal TypeScript SDK's Strands integration, mirroring the Python samples in [`samples-python/strands_plugin`](https://github.com/temporalio/samples-python/tree/main/strands_plugin).

One worker registers all activities, all workflows, and an MCP server. Each feature has its own client script in `src/`:

| Feature            | Client                                | What it demonstrates                                                                        |
| ------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------- |
| Hello World        | `npm run workflow:hello-world`        | Minimal `TemporalAgent` invocation.                                                         |
| Tools              | `npm run workflow:tools`              | Pure Strands `tool()` + `workflow.activityAsTool` for I/O.                                  |
| Human in the Loop  | `npm run workflow:human-in-the-loop`  | Gate a tool call on human approval with a `BeforeToolCallEvent` hook + `event.interrupt()`. |
| Activity Interrupt | `npm run workflow:activity-interrupt` | Activity-thrown interrupt routed through `StrandsFailureConverter`.                         |
| Hooks              | `npm run workflow:hooks`              | `AfterToolCallEvent` with in-workflow and activity-dispatched callbacks.                    |
| MCP                | `npm run workflow:mcp`                | Connect to a stdio MCP server via `TemporalMCPClient`.                                      |
| Structured Output  | `npm run workflow:structured-output`  | Constrain output with a Zod schema.                                                         |
| Streaming          | `npm run workflow:streaming`          | Forward model chunks to subscribers via `WorkflowStream`.                                   |
| Continue as New    | `npm run workflow:continue-as-new`    | Long-lived chat with history-aware continue-as-new.                                         |

### Directory layout

```
src/
├── worker.ts                  # one worker, registers everything
├── workflows.ts               # re-exports every workflow in workflows/
├── activities.ts              # re-exports every activity in activities/
├── mcp-server.ts              # stdio MCP server (used by the mcp feature)
├── <feature>.ts               # one client script per feature
├── workflows/
│   └── <feature>.ts           # workflow definition for that feature
├── activities/
│   └── <feature>.ts           # activities for that feature (only where needed)
└── mocha/
    ├── stub-model.ts          # shared StubModel for tests
    └── <feature>.test.ts      # one test per feature
```

### Prerequisites

`@temporalio/strands-agents` and `@temporalio/workflow-streams` are published on npm and already listed in this sample's `package.json`, so `npm install` in this directory is all that is needed. To add the integration to a project of your own:

```bash
npm install @temporalio/strands-agents @strands-agents/sdk
```

The integration package itself is documented in the [`@temporalio/strands-agents` README](https://github.com/temporalio/ai-integrations/tree/main/typescript/strands-agents). Node.js 22.12.0 or later is required.

### Running

1. `npm install` in this directory.
1. Configure AWS credentials so the default `BedrockModel` can reach Amazon Bedrock (`AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`). The default model is `global.anthropic.claude-sonnet-4-6`, which requires submitting Anthropic's use-case details form — pick the model in the [Bedrock model catalog](https://console.aws.amazon.com/bedrock/home#/model-catalog) and fill out the form before invoking. To use a different provider — or pin a model that doesn't require the form — swap `BedrockModel` in `src/worker.ts` for `AnthropicModel`, `OpenAIModel`, etc., from `@strands-agents/sdk`, or pass a `modelId` to `BedrockModel`.
1. `temporal server start-dev`.
1. `npm run start.watch` in one shell to start the worker.
1. `npm run workflow:<feature>` in another shell — see the table above.

### Tests

`src/mocha/*.test.ts` exercises each workflow with a `StubModel` and `TestWorkflowEnvironment`, so the suite runs without AWS credentials:

```bash
npm test
```

> The `mocha@8` version pinned across `samples-typescript` is incompatible with Node 24+ (its bundled `yargs` is loaded as ESM and breaks at startup). Use Node 22 to run tests, matching the rest of `samples-typescript`.
