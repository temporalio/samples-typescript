# Instrumentation demo

This project demonstrates how to add a [winston](https://github.com/winstonjs/winston) logger to your project and get metrics, logs and traces out of the SDK.

The [Logging docs](https://docs.temporal.io/docs/typescript/logging/) and [Core docs](https://docs.temporal.io/docs/typescript/core/) explain some of the code in this sample.

See the [opentelemetry interceptors sample](https://github.com/temporalio/samples-typescript/tree/main/interceptors-opentelemetry) for adding tracing to your own Activities and Workflows.

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/docs/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow.
