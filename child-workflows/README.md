# Child Workflows

This sample shows how to use [Child Workflows](https://docs.temporal.io/application-development/features/#child-workflows):

[`src/workflows.ts`](./src/workflows.ts)

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/application-development/foundations#run-a-development-cluster)).
2. `npm install` to install dependencies.
3. `npm run start.watch` to start the Worker.
4. In another shell, `npm run workflow` to run the Workflow.

The Workflow should return:

```
I am a child named Alice
I am a child named Bob
I am a child named Charlie
```
