# Mutex

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
