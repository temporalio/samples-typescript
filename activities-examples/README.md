# Activities Examples

This sample shows use cases for Activities:

- [`makeHTTPRequest`](./src/activities/index.ts): Make an external HTTP request in an Activity (using `axios`)
- [`cancellableFetch`](./src/activities/cancellable-fetch.ts): Make a cancellable HTTP request with [cancellationSignal](https://typescript.temporal.io/api/classes/activity.context/#cancellationsignal).

More Activity samples are [listed here](https://github.com/temporalio/samples-typescript/#activity-apis-and-design-patterns).

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/docs/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow.

The Workflow should make an HTTP request to [httpbin.org](https://httpbin.org/) and then return:

```
The answer is 42
```
