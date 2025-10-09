# Eager Workflow Start

This sample shows how to create a workflow that uses Eager Workflow Start.

The target use case is workflows whose first task needs to execute quickly (ex: payment verification in an online checkout workflow). That work typically can't be done directly in the workflow (ex: using web APIs, databases, etc.), and also needs to avoid the overhead of dispatching another task. Using a Local Activity suffices both needs, which this sample demonstrates.

You can read more about Eager Workflow Start in our:

- [Eager Workflow Start blog](https://temporal.io/blog/improving-latency-with-eager-workflow-start)
- [Worker Performance Docs](https://docs.temporal.io/develop/worker-performance#eager-workflow-start)

### Running this sample

First see [README.md](../README.md) for prerequisites.

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
2. `npm install` to install dependencies.
3. `npm run start` to run the sample
