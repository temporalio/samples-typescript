# Activity Cancellation and Heartbeating Sample

This sample demonstrates how to handle cancelling an activity when its associated workflow is canceled.

Running `execute-workflow` does this:

- Starts the `runCancellableActivity` Workflow and retains a handle to it for later use
  - The `fakeProgress` activity starts and heartbeats with increasing periods (note that heartbeats are debounced)
- Waits 100ms
- Uses the handle to `cancel()` the workflow
  - The activity's `Context.current().sleep` receives the cancellation signal and throws a `CancelledFailure` for you to handle
  - Activity catches the `CancelledFailure` which you can check with `isCancellation(err)`
    - prints `Fake progress activity cancelled` in the Worker terminal
  - Workflow prints `Workflow cancelled along with its activity` in the Worker terminal
- Prints `Cancelled workflow successfully`
- Calls `result()` demonstrate that calling `result()` on a workflow that is cancelled will throw a `WorkflowExecutionCancelledError`
- the `WorkflowExecutionCancelledError` is caught and we print `handle.result() threw because Workflow was cancelled`

## Steps to run this example

1. Make sure the Temporal Server is running locally. Follow the [Quick install guide](https://docs.temporal.io/docs/server/quick-install) to do that.
2. Run `npm install` to install dependencies.
3. Run `npm run build` to compile the project.
4. Run `npm start` to start the worker. Leave the worker process running.
5. Run `npm run workflow` to run the workflow.
