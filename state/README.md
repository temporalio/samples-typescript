# State

This sample has a Workflow that maintains state in a `Map<string, number>`. The state can be updated and read via a Signal and Query:

[`src/workflows.ts`](./src/workflows.ts)

The Client scripts are:

- [`src/start-workflow.ts`](./src/start-workflow.ts)
- [`src/query-workflow.ts`](./src/query-workflow.ts)
- [`src/signal-workflow.ts`](./src/signal-workflow.ts)
- [`src/cancel-workflow.ts`](./src/cancel-workflow.ts)

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow.start` to run the Workflow.
1. Run `npm run workflow.query` to query the Workflow. Should print `{ meaning: undefined }`
1. Run `npm run workflow.signal` to unblock the Workflow. Should print `setValueSignal sent`
1. Run `npm run workflow.query` to query the Workflow. Should print `{ meaning: 42 }`
1. Run `npm run workflow.cancel` to cancel the Workflow. Should print `workflow canceled`
