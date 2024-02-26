# Mutex

This sample has a `lockWorkflow` that receives `lock-requested` Signals from other Workflows. It handles the Signals one at a time, first sending a `lock-acquired` Signal to the sending Workflow, and then waiting for a Signal from that Workflow indicating that the Workflow is ready to release the lock. Then the `lockWorkflow` goes on to the next `lock-requested` Signal. In this way, you're able to make sure that only one Workflow Execution is performing a certain type of work at a time.

- [`src/workflows.ts`](src/workflows.ts): `lockWorkflow` and `testLockWorkflow`, which Signals `lockWorkflow` to request a lock.
- [`src/start-test-workflow.ts`](src/start-test-workflow.ts): `npm run workflow`
- [`src/test/workflows.test.ts`](src/test/workflows.test.ts): Tests

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.

1. Open two shells, and `npm run workflow my-lock-id` twice in parallel. You should see that the 2nd Workflow takes slightly longer than the first, because it needs to wait for the first Workflow to release the lock.

```
Starting test workflow with id test-bz-og68aFQJ_7BRNI0eNR connecting to lock workflow my-lock-id
Test workflow finished after 5149 ms
```

```
Starting test workflow with id test-XbhfWN6769U8RCQt0JSps connecting to lock workflow my-lock-id
Test workflow finished after 6773 ms
```

### Testing

`npm run build && npm test`
