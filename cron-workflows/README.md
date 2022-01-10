# Cron Workflows

This example demonstrates a working Cron workflow. Note the limitations and caveats listed in the [docs](https://docs.temporal.io/docs/content/what-is-a-temporal-cron-job/).

Differences from the hello world demo:

- The Workflow is started with the `cronSchedule: '* * * * *',` option: [`src/client.ts`](./src/client.ts).
- The Activity actually prints a log, instead of returning a string.
- The Workflow runs forever, so if we want it to stop, we have to cancel it. In our `client.ts` script, we cancel it using the handle (when `Ctrl/Cmd-C` is hit). Usually, we'd use the Workflow ID to cancel—for example:

```js
const handle = client.getHandle('1e793a6c-31e2-41c9-8139-53d114293a9e');
await handle.cancel();
```

Note that when we're changing code and restarting Workers, unless we cancel all previous Workflows, they may get picked up by our Worker (since we likely didn't change our Workflow name or task queue), and their output may conflict/mix with new Workflows we're starting. We can check what is still running in Temporal Web ([localhost:8088](http://localhost:8088) in case we need to kill all previous Workflows.

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/docs/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow.

Example Worker output:

```bash
Hello from my-schedule, Temporal!
Workflow time:  1636333860201
Activity time: 1636333860241
Hello from my-schedule, Temporal!
Workflow time:  1636333920319
Activity time: 1636333920340
```

The difference between "Workflow time" and "Activity time" reflects the latency between scheduling an Activity and actually starting it.

Each new Workflow is `continuedAsNew` under the hood:

![image](https://user-images.githubusercontent.com/6764957/137712906-2a1d821b-d664-442c-8f17-a174b284c722.png)

And you can see the details in the event history:

![image](https://user-images.githubusercontent.com/6764957/137713250-f19a2987-4e9f-4e76-8e35-c17507731a20.png)
