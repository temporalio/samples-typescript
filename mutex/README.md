# Mutex

This sample has a `lockWorkflow` that receives `lock-requested` Signals from other Workflows. It handles the Signals one at a time, first sending a `lock-acquired` Signal to the sending Workflow, and then waiting for a Signal from that Workflow indicating that the Workflow is ready to release the lock. Then the `lockWorkflow` goes on to the next `lock-requested` Signal. In this way, you're able to make sure that only one Workflow Execution is performing a certain type of work at a time.

- [`src/workflows.ts`](src/workflows.ts): `lockWorkflow` and `testLockWorkflow`, which Signals `lockWorkflow` to request a lock.
- [`src/start-lock-workflow.ts`](src/start-lock-workflow.ts): `npm run lock-workflow`
- [`src/start-test-workflow.ts`](src/start-test-workflow.ts): `npm run test-workflow`
- [`src/test/workflows.test.ts`](src/test/workflows.test.ts): Tests

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run lock-workflow` to run the mutex Workflow. Wait for the process to exit. You should see output similar to the following. Copy the Workflow ID.

```
Started lock workflow with id lock-42167c2d-9357-4043-9974-8d7d2d943596
```

1. Open two shells, and `npm run test-workflow <lock-workflow-id-here>` twice in parallel. You should see that the 2nd Workflow takes slightly longer than the first, because it needs to wait for the first Workflow to release the lock.

```
Starting test workflow with id test-0e418ef7-4822-4288-9377-2b59562e37b3 connecting to lock workflow lock-42167c2d-9357-4043-9974-8d7d2d943596
Test workflow finished after 5149 ms
```

```
Starting test workflow with id test-66771b99-a5c8-4481-a97f-419318f9802b connecting to lock workflow lock-42167c2d-9357-4043-9974-8d7d2d943596
Test workflow finished after 6773 ms
```

### Testing

`npm run build && npm test`
