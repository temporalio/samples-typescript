# Standalone Activities

This sample shows how to execute Activities directly from a Temporal Client, without a Workflow.

### Running this sample

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run execute` to execute activities.

Example output (activity ID will be different each time):
```
Started activity ElEpcNuDGacKlmDFzzzVq
Hello, Temporal!
Hello, World!
Hello, Temporal!
Oops! name must be a string
```

Afterwards, you can run `npm run list` to see a listing of activity executions.
