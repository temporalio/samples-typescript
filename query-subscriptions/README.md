# Query Subscriptions

Demo using [Redis Streams](https://redis.io/topics/streams-intro), [Immer](https://github.com/immerjs/immer),
and [SDK Interceptors](https://docs.temporal.io/docs/typescript/interceptors) to build a subscribable query mechanism for Workflow state.

This is an advanced sample that requires knowledge of SDK internals. There's a lot going on "behind the scenes" in [`subscriptions.ts`](./src/workflows/subscriptions.ts).
It is far simpler to manually publish updates from Workflow code but we put the sample here to show off some of the advanced capabilities provided by the runtime.

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/docs/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run subscribe` to run the Workflow.

The Workflow should return:

```
Hello, Temporal!
```
