# Activity Cancellation and Heartbeating

This sample demonstrates:

- How a retried Activity Task can resume from the last Activity Task's heartbeat.
- How to handle canceling a long-running Activity when its associated Workflow is canceled.

Docs: [Activity heartbeating](https://docs.temporal.io/typescript/activities#heartbeating) and [cancellation](https://docs.temporal.io/typescript/activities#activity-cancellation)

Running [`src/client.ts`](./src/client.ts) does this:

- Starts the `runCancellableActivity` Workflow and retains a handle to it for later use
  - The `fakeProgress` activity starts and heartbeats
- Waits 40s
- Uses the handle to `cancel()` the workflow
  - The activity's `Context.current().sleep` receives the cancellation signal and throws a `CancelledFailure` for you to handle
  - Activity catches the `CancelledFailure` which you can check with `isCancellation(err)`
    - Prints `Fake progress activity cancelled` in the Worker terminal
  - Workflow prints `Workflow cancelled along with its activity` in the Worker terminal
- Prints `Cancelled workflow successfully`
- Calls `result()` demonstrate that calling `result()` on a workflow that is cancelled will throw a `WorkflowFailedError`
  with a cause of `CancelledFailure`.
- The `WorkflowFailedError` is caught and we print `handle.result() threw because Workflow was cancelled`

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/server/quick-install/)).
2. `npm install` to install dependencies.
3. `npm run start` to start the Worker.
4. In another shell, `npm run workflow` to run the Workflow.
5. In the first shell, watch the Worker output for a few seconds:

```
Starting activity at progress: 1
Progress: 1
Progress: 2
Progress: 3
Progress: 4
Progress: 5
Progress: 6
Progress: 7
^C
```

1. Hit `Ctrl-C` to kill the Worker.
1. Wait 5 seconds (long enough for `heartbeatTimeout: '3s'` to lapse and the Activity to be rescheduled.)
1. `npm run start` to start the Worker again:

```
Starting activity at progress: 4
Progress: 4
Progress: 5
Progress: 6
Progress: 7
Progress: 8
Progress: 9
Progress: 10
Progress: 11
Progress: 12
Progress: 13
Progress: 14
Progress: 15
Progress: 16
Progress: 17
Progress: 18
Progress: 19
Progress: 20
Progress: 21
Progress: 22
Progress: 23
Progress: 24
Fake progress activity cancelled
[runCancellableActivity(cancellation-heartbeating-0)] Workflow cancelled along with its activity
```

1. In the other shell, where the client code is running (`npm run workflow`), the output should be:

```
Cancelled workflow successfully
handle.result() threw because Workflow was cancelled
```
