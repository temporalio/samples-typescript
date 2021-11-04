# samples-typescript

Each directory in this repo is a sample Temporal project built with the Typescript SDK (see [SDK docs](https://docs.temporal.io/docs/typescript/introduction/) and [API reference](https://typescript.temporal.io/)).

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Contents:**

- [Samples](#samples)
  - [Basic](#basic)
  - [API demos](#api-demos)
    - [Activity APIs and Design Patterns](#activity-apis-and-design-patterns)
    - [Workflow APIs](#workflow-apis)
    - [Advanced APIs](#advanced-apis)
  - [Apps](#apps)
- [Contributing](#contributing)
  - [Config files](#config-files)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Samples

### Basic

- [**Basic hello world**](https://github.com/temporalio/samples-typescript/tree/main/hello-world): Simple example of a Workflow Definition and an Activity Definition.
  - Variant: [Basic hello world with mTLS](https://github.com/temporalio/samples-typescript/tree/main/hello-world-mtls) shows how to connect to your Temporal Cloud namespace with mTLS authentication. [Read more on the mTLS docs](https://docs.temporal.io/docs/typescript/tls).
- [**Pure ES Modules**](https://github.com/temporalio/samples-typescript/tree/main/fetch-esm): Configure Temporal with TypeScript and Pure ESM.

### API demos

#### Activity APIs and Design Patterns

- [**Activities Examples**](https://github.com/temporalio/samples-typescript/tree/main/activities-examples):
  - `makeHTTPRequest`: Make an external HTTP request in an Activity (using `axios`)
  - `fakeProgress` (tbc)
  - `cancellableFetch` (tbc)
- [**Activity Cancellation and Heartbeating**](https://github.com/temporalio/samples-typescript/tree/main/activities-cancellation-heartbeating): Heartbeat progress for long running activities and cancel them.
- [**Dependency Injection**](https://github.com/temporalio/samples-typescript/tree/main/activities-dependency-injection): Share dependencies between activities (for example, when you need to initialize a database connection once and then pass it to multiple activities).
- [**Sticky Queues**](https://github.com/temporalio/samples-typescript/tree/main/activities-sticky-queues): Dynamically assign task queue names to ensure activities execute sequentially on the same machine (eg for CI/CD, file processing workflows).
- [**Production**](https://github.com/temporalio/samples-typescript/tree/main/production): Build code in advance for faster Worker startup times.

#### Workflow APIs

- **Timers**:
  - The [**progress example**](https://github.com/temporalio/samples-typescript/tree/main/progress) demonstrates how to use the `sleep` function from `@temporalio/workflow`.
- **Signals and Triggers**:
  - The [**Signals and Queries example**](https://github.com/temporalio/samples-typescript/tree/main/signals-and-queries) demonstrates the usage of Signals, Queries, and Workflow Cancellation.
  - **Async activity completion**: Example of an [**Expense reporting**](https://github.com/temporalio/samples-typescript/tree/main/expense) Workflow that communicates with a server API. Shows how to kick off a workflow and manually complete it at an arbitrarily later date.
- [**Cron Workflows**](https://github.com/temporalio/samples-typescript/tree/main/cron-workflows): Schedule a cron job.
- [**Child Workflows**](https://github.com/temporalio/samples-typescript/tree/main/child-workflows): Start and control Child Workflows.
- [**Infinite Workflows**](https://github.com/temporalio/samples-typescript/tree/main/continue-as-new): Use the `continueAsNew` API for indefinitely long running Workflows.
- [**Search Attributes**](https://github.com/temporalio/samples-typescript/tree/main/search-attributes): Set up Search Attributes (an experimental feature for now).

#### Advanced APIs

- Interceptors
  - [**OpenTelemetry**](https://github.com/temporalio/samples-typescript/tree/main/interceptors-opentelemetry): Use the Interceptors feature to add OpenTelemetry metrics reporting to your workflows. ⚠️ This sample is broken for now.
  - [**Query Subscriptions**](https://github.com/temporalio/samples-typescript/tree/main/query-subscriptions): Use Redis Streams, Immer, and SDK Interceptors to subscribe to Workflow state.

### Apps

- **Next.js**:
  - [**One-click e-commerce**](https://github.com/temporalio/samples-typescript/tree/main/nextjs-ecommerce-oneclick): Buy an item with one click, and the Workflow will wait 5 seconds to see if the user cancels before it executes the order.
  - Food Delivery: https://github.com/lorensr/food-delivery
- E-commerce example: https://github.com/vkarpov15/temporal-ecommerce-ts
- XState example: https://github.com/Devessier/temporal-electronic-signature

## Contributing

External contributions are very welcome! Before submitting a major PR, please find consensus on it in [Issues](https://github.com/temporalio/samples-typescript/issues).

To start, run these commands in the root directory:

```bash
npm install
npm run prepare
npm run bootstrap
```

Prettier and ESLint are run on each commit, but you can also run them manually:

```sh
npm run format
npm run lint
```

### Config files

Also on each commit, config files from [`.shared/`](https://github.com/temporalio/samples-typescript/tree/main/.shared) are copied into each sample directory, overwriting the sample directory's config files (with a few exceptions listed in [`.scripts/copy-shared-files.mjs`](https://github.com/temporalio/samples-typescript/blob/main/.scripts/copy-shared-files.mjs)). So if you're editing config files, you usually want to be editing the versions in `.shared/`.

The [`.post-create`](https://github.com/temporalio/samples-typescript/blob/main/.shared/.post-create) file is a [chalk template](https://github.com/chalk/chalk-cli#template-syntax) that is displayed in the command line after someone uses [`npx @temporalio/create`](https://docs.temporal.io/docs/typescript/package-initializer). If you're adding a sample that requires different instructions from the default message, then add your sample name to [`POST_CREATE_EXCLUDE`](https://github.com/temporalio/samples-typescript/blob/main/.scripts/copy-shared-files.mjs) and your message template to `your-sample/.post-create`.
