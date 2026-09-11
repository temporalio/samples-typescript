# Standalone Activity

This sample shows how to execute Activities directly from a Temporal Client, without a Workflow.

**Note: Temporal CLI support for Standalone Activities requires CLI version 1.9.0.** See setup guide: https://docs.temporal.io/cli/setup-cli

### Running this sample

1. `temporal server start-dev` to start Temporal Server.
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run execute` to execute the activity in different ways.

Example output:

```
Hello, Temporal!
Hello, World!
Hello, Temporal!
Oops! name must be a string
```

Afterwards, you can run `npm run list` to see a listing of activity executions.
