# Activity Cancellation and Heartbeating

This sample demonstrates how to handle canceling a long-running Activity when its associated Workflow is canceled.

Docs: [Activity heartbeating](https://docs.temporal.io/docs/typescript/activities#heartbeating) and [cancellation](https://docs.temporal.io/docs/typescript/activities#activity-cancellation)

Running [`src/client.ts`](./src/client.ts) does this:

- Starts the `runCancellableActivity` Workflow and retains a handle to it for later use
  - The `fakeProgress` activity starts and heartbeats with increasing periods (note that heartbeats are debounced)
- Waits 100ms
- Uses the handle to `cancel()` the workflow
  - The activity's `Context.current().sleep` receives the cancellation signal and throws a `CancelledFailure` for you to handle
  - Activity catches the `CancelledFailure` which you can check with `isCancellation(err)`
    - Prints `Fake progress activity cancelled` in the Worker terminal
  - Workflow prints `Workflow cancelled along with its activity` in the Worker terminal
- Prints `Cancelled workflow successfully`
- Calls `result()` demonstrate that calling `result()` on a workflow that is cancelled will throw a `WorkflowFailedError`
  with a cause of `CancelledFailure`.
- the `WorkflowFailedError` is caught and we print `handle.result() threw because Workflow was cancelled`

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/docs/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow.

The output should be:

```
Cancelled workflow successfully
handle.result() threw because Workflow was cancelled
```
