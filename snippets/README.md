# Snippets

This project is for making sure code snippets we use in the docs that don't fit in other samples compile and run.

- [`client.ts`](./src/client.ts) sets a Workflow Retry Policy
- [`workflows.ts](./src/workflows.ts) sometimes fails by throwing an `ApplicationFailure`

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow Client.

If the Workflow fails 3 times, you'll see:

```bash
WorkflowFailedError: Workflow execution failed
  ...
  retryState: 4
```

`retryState: 4` corresponds to [`RETRY_STATE_MAXIMUM_ATTEMPTS_REACHED`](https://typescript.temporal.io/api/enums/common.retrystate/#retry_state_maximum_attempts_reached).

Otherwise, you'll see:

```bash
Completed successfully
```
