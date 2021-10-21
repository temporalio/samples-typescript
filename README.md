# samples-typescript

## How to use

Make sure the Temporal Server is running locally. Follow the [Quick install guide](https://docs.temporal.io/docs/server/quick-install) to do that.

Each directory contains a sample app that has a separate `README.md` with instructions on how to run that app.

### Contributing

```bash
npm install # at project root
```

This repo uses `husky` and `eslint` to ensure code standards - make sure to run `npm install` at the project root, as `husky` needs to lint every git commit.

External contributions are very welcome, just please make sure you agree with us on the overall direction before sending in your PR.

## Samples directory

- [**Basic hello world**](https://github.com/temporalio/samples-typescript/tree/main/hello-world): Simple example of a Workflow Definition and an Activity Definition.
  - Variant: [Basic hello world with mTLS](https://github.com/temporalio/samples-typescript/tree/main/hello-world-mtls) shows how to connect to your Temporal Cloud namespace with mTLS authentication. [Read more on the mTLS docs](https://docs.temporal.io/docs/typescript/tls).
- [**Pure ES Modules**](https://github.com/temporalio/samples-typescript/tree/main/fetch-esm) - Example of how to configure Temporal with TyepScript and Pure ESM.

### API demonstrations

**Activities APIs and Design Patterns**

- [**Activities Examples**](https://github.com/temporalio/samples-typescript/tree/main/activities-examples):
  - `makeHTTPRequest`: How to make an external HTTP request in an activity, with `axios`
  - fakeProgress (tbc)
  - cancellableFetch (tbc)
- [**Activity Cancellation and Heartbeating**](https://github.com/temporalio/samples-typescript/tree/main/activities-cancellation-heartbeating): This sample shows how to heartbeat progress for long running activities and cancel them.
- [**Dependency Injection**](https://github.com/temporalio/samples-typescript/tree/main/activities-dependency-injection): This sample shows how to share dependencies between activities, for example when you need to initialize a database connection once and then pass it to multiple dependencies.
- [**Sticky Queues**](https://github.com/temporalio/samples-typescript/tree/main/activities-sticky-queues): This sample shows how to dynamically assign task queue names to ensure activities execute sequentially on the same machine (eg for CI/CD, file processing workflows)

**Workflow APIs**

- [**Cron Workflows**](https://github.com/temporalio/samples-typescript/tree/main/cron-workflows): how to schedule a cron job with Temporal.
- [**Child Workflows**](https://github.com/temporalio/samples-typescript/tree/main/child-workflows)
- **Timers**:
  - The [**progress example**](https://github.com/temporalio/samples-typescript/tree/main/progress) demonstrates how to use the `sleep` function from `@temporalio/workflow`.
- **Signals and Triggers**:
  - The [**Signals and Queries example**](https://github.com/temporalio/samples-typescript/tree/main/signals-and-queries) demonstrates the usage of Signals, Queries, and Workflow Cancellation.
  - **Async activity completion**: Example of an [Expense reporting](https://github.com/temporalio/samples-typescript/tree/main/expense) Workflow that communicates with a server API. How to kick off a workflow, and manually complete it at an arbitrarily later date.
- [**Cancellation**](https://github.com/temporalio/samples-typescript/tree/main/cancellation): How to programmatically cancel a workflow

### Example Apps

- **Next.js**:
  - The `nextjs-oneclick` example: https://github.com/temporalio/samples-typescript/tree/main/nextjs-ecommerce-oneclick
  - [Food Delivery](https://github.com/lorensr/food-delivery)
- Ecommerce example: https://github.com/vkarpov15/temporal-ecommerce-ts

### Advanced APIs

- Interceptors
  - [OpenTelemetry](https://github.com/temporalio/samples-typescript/tree/main/interceptors-opentelemetry): How to use the Interceptors feature to add OpenTelemetry metrics reporting to your workflows. ⚠️ This sample is broken for now.
  - [Query Subscriptions](https://github.com/temporalio/samples-typescript/tree/main/interceptors-opentelemetry): Demo using Redis Streams, Immer, and SDK Interceptors to build a subscribable query mechanism for Workflow state.
