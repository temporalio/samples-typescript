# samples-node

## How to use

Make sure the Temporal Server is running locally. Follow the [Quick install guide](https://docs.temporal.io/docs/server/quick-install) to do that.

Each directory contains a sample app that has a separate `README.md` with instructions on how to run that app.

## Samples directory

- [**Basic hello world**](https://github.com/temporalio/samples-node/tree/main/hello-world): Simple example of a Workflow Definition and an Activity Definition.
  - Variant: [Basic hello world with mTLS](https://github.com/temporalio/samples-node/tree/main/hello-world-mtls) shows how to connect to your Temporal Cloud namespace with mTLS authentication.

### API demonstrations

- [**HTTP Fetch**](https://github.com/temporalio/samples-node/tree/main/http): How to make an external HTTP request in an activity, with `axios`
- **Timers**:
  - The [**progress example**](https://github.com/temporalio/samples-node/tree/main/progress) demonstrates how to use the `sleep` function from `@temporalio/workflow`.
- **Signals and Triggers**:
  - **Async activity completion**: Example of an [Expense reporting](https://github.com/temporalio/samples-node/tree/main/expense) Workflow that communicates with a server API. How to kick off a workflow, and manually complete it at an arbitrarily later date.
- [**Cancellation**](https://github.com/temporalio/samples-node/tree/main/cancellation): How to programmatically cancel a workflow

### Example Apps

- **Next.js**:
  - The `nextjs-oneclick` example
  - [Food Delivery](https://github.com/lorensr/food-delivery)

### Advanced APIs

- [**Interceptors**](https://github.com/temporalio/samples-node/tree/main/interceptors-opentelemetry): How to use the Interceptors feature to add OpenTelemetry metrics reporting to your workflows
