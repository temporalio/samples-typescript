# Worker-Specific Task Queues

Use a unique Task Queue for each Worker in order to have certain Activities run on a specific Worker.

The strategy is:

- Create a `getUniqueTaskQueue` Activity that generates a unique Task Queue name, `uniqueWorkerTaskQueue`.
- It doesn't matter where this Activity is run, so it can be on any Worker on a shared Task Queue.
- In this demo, `uniqueWorkerTaskQueue` is simply a `uuid` initialized in the Worker, but you can inject smart logic here to uniquely identify the Worker, [as Netflix did](https://community.temporal.io/t/using-dynamic-task-queues-for-traffic-routing/3045).
- For Activities that need to run on the same Worker, run them on `uniqueWorkerTaskQueue`, and have only a single Worker listening on `uniqueWorkerTaskQueue`.
- Execute Workflows from the Client like normal.

Activities have been artificially slowed with `activity.Context().sleep(3000)` to simulate slow activities.

### Running this sample

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow.

Example output:

```bash
Downloading https://temporal.io and saving to /tmp/b15036de-dbc7-4bc9-b2c7-7c48635c5797

Did some work on /tmp/b15036de-dbc7-4bc9-b2c7-7c48635c5797, checksum: b3fc767460efa514753a75e6f3d7af97

Removing /tmp/b15036de-dbc7-4bc9-b2c7-7c48635c5797
```

<details>
<summary>Example history in Temporal Web</summary>

![image](https://user-images.githubusercontent.com/6764957/137707555-967503fd-d0d5-4b57-a04e-48d297ab7dfb.png)

</details>

### Things to try

You can try to intentionally crash Workers while they are doing work to see what happens when work gets "stuck" in a unique queue: currently the Workflow will `scheduleToCloseTimeout` without a Worker, and retry when a Worker comes back online.

<details>
<summary>Workflow history with crash</summary>

![image](https://user-images.githubusercontent.com/6764957/137708492-41611a1f-3093-4221-800c-017c0a9d88b2.png)

</details>

After the 5th attempt, it logs `Final attempt 5 failed, giving up` and exits. But you may wish to implement compensatory logic, including notifying you.
