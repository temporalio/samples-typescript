# AI Sdk

This project demonstrates some uses of the AI SDK inside Temporal.

### Setup

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
1. `npm install` to install dependencies.
1. `export OPENAI_API_KEY=<KEY>`
1. `npm run start.watch` to start the Worker.

### Run the samples

1. `npm run workflow haiku`
1. `npm run workflow tools`
1. `npm run workflow mcp`
1. `npm run workflow middleware`
1. `npm run workflow stream`

### Streaming

The `stream` sample shows how to stream model output out of a
Workflow. `streamText` runs the model call in
an activity that publishes each delta onto a
[Workflow Stream](https://docs.temporal.io/develop/typescript/workflows/workflow-streams)
topic. The Workflow hosts the stream (`new WorkflowStream()`) and durably reassembles the
final result, while external consumers subscribe by Workflow id to render the tokens live
as they arrive — see `src/client.ts`.
