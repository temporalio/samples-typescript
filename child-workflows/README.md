# Child Workflows

This sample shows how to use [child workflows](https://docs.temporal.io/docs/typescript/workflows#child-workflows):

[`src/workflows.ts`](./src/workflows.ts)

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/docs/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow.

The Workflow should return:

```
I am a child named Alice
I am a child named Bob
I am a child named Charlie
```
