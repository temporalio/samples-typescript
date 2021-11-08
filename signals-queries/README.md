# Signals and Queries

This example demonstrates the usage of [Signals, Queries](https://docs.temporal.io/docs/typescript/workflows#signals-and-queries), and [Workflow Cancellation](https://docs.temporal.io/docs/typescript/cancellation-scopes).

Signals, Queries, and cancellation messages are sent through the `WorkflowClient`:

[`src/execute-workflow.ts`](./src/execute-workflow.ts)

and are handled in the Workflow:

[`src/workflows.ts`](./src/workflows.ts)

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/docs/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow.

The Workflow should return:

```
Hello, Temporal!
```
