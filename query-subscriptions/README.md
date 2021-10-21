# query-subscriptions

Demo using [Redis Streams](https://redis.io/topics/streams-intro), [Immer](https://github.com/immerjs/immer),
and [SDK Interceptors](https://docs.temporal.io/docs/typescript/interceptors) to build a subscribable query mechanism for Workflow state.

This is an advanced sample that requires knowledge of SDK internals. There's a lot going on "behind the scenes" in [subscriptions.ts](./src/workflows/subscriptions.ts).
It is far simpler to manually publish updates from Workflow code but we put the sample here for showing off some of the advanced capabilities provided by the runtime.

## Steps to run this example

1. Make sure the Temporal Server is running locally. Follow the [Quick install guide](https://docs.temporal.io/docs/server/quick-install) to do that.
1. Run `npm install` to install dependencies.
1. Run `npm run start.watch` to start the worker and reload when the code changes. Leave the worker process running.
1. Run `npm run subscribe` to run the workflow. It should print out `Hello, Temporal!`
