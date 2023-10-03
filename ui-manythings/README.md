# Child Workflows

This sample shows how to use [Child Workflows](https://docs.temporal.io/dev-guide/typescript/features#child-workflows):

[`src/workflows.ts`](./src/workflows.ts)

### Running this sample

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
2. `npm install` to install dependencies.
3. `npm run start.watch` to start the Worker.
4. In another shell, `npm run workflow` to run the Workflow.

The Workflow should return:

```
I am a child named Alice
I am a child named Bob
I am a child named Charlie
```
