# cron-workflows

This example demonstrates a working Cron workflow. Note the limitations and caveats listed in the docs: http://localhost:3000/docs/content/what-is-a-temporal-cron-job/.

Differences to the hello world demo:

- the activity actually prints a log, instead of returning a string.
- the Client exits without waiting for the scheduled workflow to complete, printing an id like `
Cron Workflow 1e793a6c-31e2-41c9-8139-53d114293a9e started` which can be used to cancel later

Note that if you are changing code and restarting Workers, that your old, still-running workflows may pick up the new code (since you likely didn't change workflow name or task queue) and their output may conflict/mix with new workflows you are starting. You should check what is still running in Temporal Web in case you need to kill all previous workflows (this is not default behavior).

## Steps to run this example

1. Make sure the Temporal Server is running locally. Follow the [Quick install guide](https://docs.temporal.io/docs/server/quick-install) to do that.
2. Run `npm install` to install dependencies.
3. Run `npm run build` to compile the project.
4. Run `npm start` to start the worker. Leave the worker process running.
5. Run `npm run workflow` to run the workflow. It should print out `Hello, Temporal!`

Example output

```bash
Hello, Temporal!
Workflow time:  1634551851356
Activity time: 1634551851802
Hello, Temporal!
Workflow time:  1634551860900
Activity time: 1634551861106
```

The difference between "Workflow time" and "Activity time" reflects the latency between scheduling an Activity and actually starting it.

Each new Workflow is `continuedAsNew` under the hood:

![image](https://user-images.githubusercontent.com/6764957/137712906-2a1d821b-d664-442c-8f17-a174b284c722.png)

And you can see the details in the event history:

![image](https://user-images.githubusercontent.com/6764957/137713250-f19a2987-4e9f-4e76-8e35-c17507731a20.png)
