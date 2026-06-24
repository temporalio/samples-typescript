# Strands Agents

A complete set of samples for the Temporal TypeScript SDK's Strands integration, mirroring the Python samples in [`samples-python/strands_plugin`](https://github.com/temporalio/samples-python/tree/strands-plugin-samples/strands_plugin).

One worker registers all activities, all workflows, and an MCP server. Each feature has its own client script in `src/`:

| Feature | Client | What it demonstrates |
| --- | --- | --- |
| Hello World | `npm run workflow:hello-world` | Minimal `TemporalAgent` invocation. |
| Tools | `npm run workflow:tools` | Pure Strands `tool()` + `workflow.activityAsTool` for I/O. |
| Human in the Loop | `npm run workflow:human-in-the-loop` | Gate a tool call on human approval with a `BeforeToolCallEvent` hook + `event.interrupt()`. |
| Activity Interrupt | `npm run workflow:activity-interrupt` | Activity-thrown interrupt routed through `StrandsFailureConverter`. |
| Hooks | `npm run workflow:hooks` | `AfterToolCallEvent` with in-workflow and activity-dispatched callbacks. |
| MCP | `npm run workflow:mcp` | Connect to a stdio MCP server via `TemporalMCPClient`. |
| Structured Output | `npm run workflow:structured-output` | Constrain output with a Zod schema. |
| Streaming | `npm run workflow:streaming` | Forward model chunks to subscribers via `WorkflowStream`. |
| Continue as New | `npm run workflow:continue-as-new` | Long-lived chat with history-aware continue-as-new. |

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

`@temporalio/strands-agents` and its dependency `@temporalio/workflow-streams` live in [`temporalio/sdk-typescript`](https://github.com/temporalio/sdk-typescript) on the `strands` branch and are not yet published to npm. `package.json` references both as `file:` tarballs, assuming `sdk-typescript` is checked out next to `samples-typescript`:

```
<your-workspace>/
├── samples-typescript/    # this repo
└── sdk-typescript/        # the SDK repo on branch `strands`
```

Before installing, build the contrib packages and produce the tarballs (the `workspace:*` deps inside them need to be substituted with concrete versions, which `pnpm pack` does automatically):

```bash
cd /path/to/sdk-typescript
git checkout strands
pnpm install
pnpm build

cd contrib/strands && pnpm pack && cd ../..
cd contrib/workflow-streams && pnpm pack && cd ../..
# `@temporalio/common` needs to be packed too because the streaming feature
# relies on the `INTERNAL_HANDLER_NAME_ALLOWLIST` added on the `strands` branch
# but not yet published to npm. The sample's `package.json` overrides every
# transitive `@temporalio/common` with this tarball.
cd packages/common && pnpm pack && cd ../..
```

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
