# LangSmith Tracing for Temporal

These samples use the `@temporalio/langsmith` integration to add [LangSmith](https://docs.smith.langchain.com/) tracing to Temporal Workflows and Activities. Code you already instrument with LangSmith's native `traceable` keeps working unchanged when it runs inside a Workflow or Activity body — you only add the plugin to your Temporal Client and Worker, and the plugin threads a single trace across the `workflow → activity → child-workflow` boundaries.

This is a single project: one `package.json` and one set of configs at the `langsmith/` root, with each scenario in its own subdirectory. Run `npm install` once here, then run any scenario by path (see each scenario's README). The integration package itself is documented in the [`@temporalio/langsmith` README](https://github.com/temporalio/sdk-typescript/tree/main/contrib/langsmith).

## Prerequisites

These apply to every sample in this directory:

- A running Temporal dev server: `temporal server start-dev`.
- Node 22 or later.
- Dependencies installed once at the `langsmith/` root: `npm install`.

Tracing is **off by default**, matching the `langsmith` library. To see live traces in LangSmith, enable it in the Worker and Client process environment:

```bash
export LANGSMITH_TRACING=true
export LANGSMITH_API_KEY=...
```

With tracing off the plugin is a no-op. The tests enable it in-process and assert against an in-memory LangSmith Client, so they need no API key.

## Samples

| Sample                                  | Demonstrates                                                                           |
| :-------------------------------------- | :------------------------------------------------------------------------------------ |
| [`activity-tracing`](./activity-tracing) | A `traceable` model call inside an Activity, nested under the Workflow and Activity runs. |
| [`workflow-tracing`](./workflow-tracing) | Replay-safe `traceable` calls in a Workflow body — emitted once, never duplicated on replay. |
| [`agent-pipeline`](./agent-pipeline)    | A multi-step agent whose trace threads through Activities and a child Workflow.        |
| [`message-handlers`](./message-handlers) | `traceable` calls inside Signal and Update handlers, nested under each handler's run.  |
