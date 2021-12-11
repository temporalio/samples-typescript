# DSL Interpreter Workflow

This sample demonstrates how to implement a DSL workflow, based on the [Go equivalent](https://github.com/temporalio/samples-go/tree/main/dsl). In this sample, we provide 2 sample yaml files each defines a custom workflow that can be processed by this DSL workflow sample code.

### Running this sample

1. Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/docs/server/quick-install/)).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another terminal, `npm run workflow1` or `npm run workflow2` to run the Workflows accordingly
