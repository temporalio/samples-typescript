# Signals and Queries

This example demonstrates the usage of [Signals, Queries](https://docs.temporal.io/typescript/workflows#signals-and-queries), and [Workflow Cancellation](https://docs.temporal.io/typescript/cancellation-scopes).

Signals, Queries, and cancellation messages are sent through the `WorkflowClient`:

- [`src/start-workflow.ts`](./src/start-workflow.ts)
- [`src/query-workflow.ts`](./src/query-workflow.ts)
- [`src/signal-workflow.ts`](./src/signal-workflow.ts)
- [`src/cancel-workflow.ts`](./src/cancel-workflow.ts)

and are handled in the Workflow:

[`src/workflows.ts`](./src/workflows.ts)

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow.start` to run the Workflow.
1. Run `npm run workflow.query` to query the Workflow. Should print `blocked? true`
1. Run `npm run workflow.signal` to unblock the Workflow. Should print `unblockSignal sent`
1. Run `npm run workflow.query` to query the Workflow. Should print `blocked? false`
1. Run `npm run workflow.cancel` to cancel the Workflow. Should print `workflow canceled`
