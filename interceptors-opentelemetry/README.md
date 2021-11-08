# OpenTelemetry Interceptors

This sample features '@temporalio/interceptors-opentelemetry`, which uses [Interceptors](https://docs.temporal.io/docs/typescript/interceptors) to add tracing of Workflows and Activities with [opentelemetry](https://opentelemetry.io/).

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/docs/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow.

The Workflow should return:

```
Hello, Temporal!
```
