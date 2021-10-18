# sticky-activity-queues

This sample shows how to use a unique task queue per Worker for running activities that are bound to that specific Worker.

The strategy is:

-  create a `getUniqueTaskQueue` activity that generates a unique task queue name.
  - It doesn't matter where this activity is run so this can be "non sticky" as per Temporal default behavior
  - In this demo, `uniqueWorkerTaskQueue` simply reflects a `uuid` initialized in the Worker, but you can inject smart logic here to uniquely identify the Worker, [as Netflix did](https://community.temporal.io/t/using-dynamic-task-queues-for-traffic-routing/3045)
- For activities intended to be "sticky", only register them in one Worker, and have that be the only Worker listening on that `uniqueWorkerTaskQueue`
- execute workflows from the Client like normal

## Steps to run this example

1. Make sure the Temporal Server is running locally. Follow the [Quick install guide](https://docs.temporal.io/docs/server/quick-install) to do that.
2. Run `npm install` to install dependencies.
3. Run `npm run build` to compile the project.
4. Run `npm start` to start the worker. Leave the worker process running.
5. Run `npm run workflow` to run the workflow.

Example output:

```bash
Downloading https://temporal.io and saving to /tmp/b15036de-dbc7-4bc9-b2c7-7c48635c5797

Did some work on /tmp/b15036de-dbc7-4bc9-b2c7-7c48635c5797, checksum: b3fc767460efa514753a75e6f3d7af97

Removing /tmp/b15036de-dbc7-4bc9-b2c7-7c48635c5797
```