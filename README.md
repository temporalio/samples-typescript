# samples-typescript

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Running](#running)
  - [In browser](#in-browser)
  - [Locally](#locally)
  - [Scaffold](#scaffold)
- [Samples](#samples)
  - [Basic](#basic)
  - [API demos](#api-demos)
    - [Activity APIs and design patterns](#activity-apis-and-design-patterns)
    - [Workflow APIs](#workflow-apis)
    - [Production APIs](#production-apis)
    - [Advanced APIs](#advanced-apis)
    - [Test APIs](#test-apis)
  - [Full-stack apps](#full-stack-apps)
- [External apps & libraries](#external-apps--libraries)
- [Contributing](#contributing)
  - [Upgrading the SDK version](#upgrading-the-sdk-version)
  - [Config files](#config-files)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

Each directory in this repo is a sample Temporal project built with the [TypeScript SDK](https://github.com/temporalio/sdk-typescript/) (see [docs](https://docs.temporal.io/typescript/introduction/) and [API reference](https://typescript.temporal.io/)).

## Running

### In browser

The fastest way to try out these samples is running them in the browser:

- Gitpod: [One click to try](https://gitpod.io/#https://github.com/temporalio/samples-typescript/) (there is a good free tier)
- [GitHub Codespaces](https://docs.github.com/en/codespaces/developing-in-codespaces/creating-a-codespace#creating-a-codespace) (if your org admin has enabled this) - [90 second video demo](https://youtu.be/FdEQQC9EdfU)

### Locally

Run Temporal Server:

```sh
git clone https://github.com/temporalio/docker-compose.git temporal
cd temporal
docker-compose up -d
```

Use Node version 14+:

- Install Node 16:
  - Mac: `brew install node@16`
  - Other: [nodejs.org/en/download/](https://nodejs.org/en/download/)
- Or use a Node version manager: [`fnm`](https://github.com/Schniz/fnm#readme)

Run the [`hello-world`](hello-world/) sample:

```sh
git clone https://github.com/temporalio/samples-typescript.git
cd samples-typescript/hello-world
npm i
npm start
```

and in another terminal:

```sh
npm run workflow
```

### Scaffold

To scaffold a new project from one of these samples, run:

```sh
npx @temporalio/create@latest my-project --sample sample-name
```

or:

```sh
npx @temporalio/create@latest my-project
```

and you'll be given the list of sample options.

## Samples

### Basic

- [**Basic hello world**](https://github.com/temporalio/samples-typescript/tree/main/hello-world): Simple example of a Workflow Definition and an Activity Definition.
  - Variant: [Basic hello world with mTLS](https://github.com/temporalio/samples-typescript/tree/main/hello-world-mtls) shows how to connect to your Temporal Cloud namespace with mTLS authentication.
- [**Pure ES Modules**](https://github.com/temporalio/samples-typescript/tree/main/fetch-esm): Configure Temporal with TypeScript and Pure ESM.
- [**JavaScript**](https://github.com/temporalio/samples-typescript/tree/main/hello-world-js): The Hello World sample in JavaScript instead of TypeScript.

### API demos

#### Activity APIs and design patterns

- [**Activities Examples**](https://github.com/temporalio/samples-typescript/tree/main/activities-examples):
  - `makeHTTPRequest`: Make an external HTTP request in an Activity (using `axios`)
  - `cancellableFetch`: Make a cancellable HTTP request with [`cancellationSignal`](https://typescript.temporal.io/api/classes/activity.context/#cancellationsignal).
- [**Activity Cancellation and Heartbeating**](https://github.com/temporalio/samples-typescript/tree/main/activities-cancellation-heartbeating): Heartbeat progress for long running activities and cancel them.
- [**Dependency Injection**](https://github.com/temporalio/samples-typescript/tree/main/activities-dependency-injection): Share dependencies between activities (for example, when you need to initialize a database connection once and then pass it to multiple activities).
- [**Sticky Activities**](https://github.com/temporalio/samples-typescript/tree/main/activities-sticky-queues): Use a unique task queue per Worker to have certain Activities only run on that specific Worker. For instance for a file processing Workflow, where the first Activity is downloading a file, and subsequent Activities need to operate on that file. (And if multiple Workers are on the same queue, subsequent Activities may be run on a different machine that doesn't have the downloaded file.)

#### Workflow APIs

- **Timers**:
  - The [**progress example**](https://github.com/temporalio/samples-typescript/tree/main/timer-progress) demonstrates how to use the `sleep` function from `@temporalio/workflow`.
  - [**Timer Examples**](https://github.com/temporalio/samples-typescript/tree/main/timer-examples):
    - Send a notification to the customer if their order is taking longer than expected (using a `Promise.race` between the order activity and `sleep`).
    - Create an `UpdatableTimer` that can be slept on, and at the same time, have its duration updated via Signals.
- **Signals and Triggers**:
  - The [**Signals and Queries example**](https://github.com/temporalio/samples-typescript/tree/main/signals-queries) demonstrates the usage of Signals, Queries, and Workflow Cancellation.
  - **Async activity completion**: Example of an [**Expense reporting**](https://github.com/temporalio/samples-typescript/tree/main/expense) Workflow that communicates with a server API. Shows how to kick off a Workflow and manually complete it at an arbitrarily later date.
- [**Cron Workflows**](https://github.com/temporalio/samples-typescript/tree/main/cron-workflows): Schedule a cron job.
- [**Child Workflows**](https://github.com/temporalio/samples-typescript/tree/main/child-workflows): Start and control Child Workflows.
- [**Infinite Workflows**](https://github.com/temporalio/samples-typescript/tree/main/continue-as-new): Use the `continueAsNew` API for indefinitely long running Workflows.
- [**Search Attributes**](https://github.com/temporalio/samples-typescript/tree/main/search-attributes): Create, set, upsert, and read Search Attributes.
- [**Subscriptions**](https://github.com/temporalio/subscription-workflow-project-template-typescript/)

#### Production APIs

- [**Production Build**](https://github.com/temporalio/samples-typescript/tree/main/production): Build code in advance for faster Worker startup times.
- [**Debugging**](https://docs.temporal.io/typescript/troubleshooting): The [replay-history](https://github.com/temporalio/samples-typescript/tree/main/replay-history) sample shows how to retrieve Workflow Event History and debug it using the `runReplayHistory` Worker API ([video](https://youtu.be/fN5bIL7wc5M)).
- [**Patching**](https://docs.temporal.io/typescript/patching/): Patch in new Workflow code when making updates to Workflows that have executions in progress in production.
- [**Logging**](https://github.com/temporalio/samples-typescript/tree/main/logging-sinks): Use Sinks to extract data out of Workflows for logging/metrics/tracing purposes.
- [**Instrumentation**](https://github.com/temporalio/samples-typescript/tree/main/instrumentation): Use a [winston](https://github.com/winstonjs/winston) logger to get logs out of all SDK components and get metrics and traces out of Rust Core.
- [**Protobufs**](https://github.com/temporalio/samples-typescript/tree/main/protobufs): Use [Protobufs](https://docs.temporal.io/typescript/data-converters#protobufs).
- [**Custom Payload Converter**](https://github.com/temporalio/samples-typescript/tree/main/ejson): Customize data serialization by creating a `PayloadConverter` that uses EJSON to convert Dates, binary, and regexes.

#### Advanced APIs

- Interceptors
  - [**OpenTelemetry**](https://github.com/temporalio/samples-typescript/tree/main/interceptors-opentelemetry): Use the Interceptors feature to add OpenTelemetry metrics reporting to your workflows.
  - [**Query Subscriptions**](https://github.com/temporalio/samples-typescript/tree/main/query-subscriptions): Use Redis Streams, Immer, and SDK Interceptors to subscribe to Workflow state.
- [gRPC calls](https://github.com/temporalio/samples-typescript/tree/main/grpc-calls): Make raw gRPC calls for advanced queries not covered by the WorkflowClient API.

#### Test APIs

- [**Mocha and Jest**](https://github.com/temporalio/samples-typescript/tree/main/activities-examples#testing)
- [**Time skipping**](https://github.com/temporalio/samples-typescript/tree/main/timer-examples#testing)

### Full-stack apps

- **Next.js**:
  - [**One-click e-commerce**](https://github.com/temporalio/samples-typescript/tree/main/nextjs-ecommerce-oneclick): Buy an item with one click, and the Workflow will wait 5 seconds to see if the user cancels before it executes the order.

## External apps & libraries

_The below projects are maintained outside this repo and may not be up to date._

- **Express**:
  - [`vkarpov15/temporal-ecommerce-ts`](https://github.com/vkarpov15/temporal-ecommerce-ts): The `cartWorkflow` used in [this blog series](https://docs.temporal.io/blog/build-an-ecommerce-app-with-temporal-part-1/)
  - [`temporal-rest`](https://www.npmjs.com/package/temporal-rest): Express middleware router that automatically exposes endpoints for Workflows, Signals, and Queries.
- **Remix**:
  - [`gustavofsantos/temporal-survey`](https://github.com/gustavofsantos/temporal-survey)
- **NestJS**:
  - [`nestjs-temporal`](https://www.npmjs.com/package/nestjs-temporal)
- **Chatbots**:
  - [`JoshuaKGoldberg/temporal-adventure-bot`](https://github.com/JoshuaKGoldberg/temporal-adventure-bot): Choose-your-own-adventure Slack/Discord chatbot (see [tutorial](https://docs.temporal.io/typescript/chatbot-tutorial) and [video](https://www.youtube.com/watch?v=hGIhc6m2keQ))
- **Caching**:
  - [`vkarpov15/temporal-api-caching-example`](https://github.com/vkarpov15/temporal-api-caching-example/): Cache data from a third-party API (see [blog post](https://docs.temporal.io/blog/caching-api-requests-with-long-lived-workflows))
- **DSL Control Flows**:
  - [**YAML DSL Interpreter**](https://github.com/temporalio/samples-typescript/tree/main/dsl-interpreter): Make Workflows interpret a custom YAML-based Domain Specific Language of your design.
  - [**XState Interpreter**](https://github.com/Devessier/temporal-electronic-signature): Interpret XState state charts in a Workflow. Presented at [the November 2021 meetup](https://youtu.be/GpbOkDjpeYU?t=1616).
- **URL Scraping**
  - [`andreasasprou/temporal-url-batch-scraping`](https://github.com/andreasasprou/temporal-url-batch-scraping)
- **Polyglot**:
  - [`temporalio/temporal-pendulum`](https://github.com/temporalio/temporal-pendulum): Use TS alongside other languages

## Contributing

External contributions are very welcome! 🤗 (Big thank you to those who have [already contributed](https://github.com/temporalio/samples-typescript/graphs/contributors) 🙏)

Before submitting a major PR, please find consensus on it in [Issues](https://github.com/temporalio/samples-typescript/issues).

To get started developing, run:

```bash
git clone https://github.com/temporalio/samples-typescript.git
cd samples-typescript
npm install
npm run prepare
npm run bootstrap
```

Prettier and ESLint are run on each commit, but you can also run them manually:

```sh
npm run format
npm run lint
```

### Upgrading the SDK version

```sh
shopt -s extglob
for f in !(monorepo-folders)/package.json; do jq '.dependencies.temporalio = "NEW_VERSION_HERE"' $f | sponge $f; done
jq '.devDependencies."@temporalio/client" = "NEW_VERSION_HERE"' package.json | sponge package.json;
jq '.dependencies."@temporalio/interceptors-opentelemetry" = "NEW_VERSION_HERE"' interceptors-opentelemetry/package.json | sponge interceptors-opentelemetry/package.json;
for f in monorepo-folders/packages/!(frontend-ui)/package.json; do jq '.dependencies.temporalio = "NEW_VERSION_HERE"' $f | sponge $f; done
```

### Config files

Also on each commit, config files from [`.shared/`](https://github.com/temporalio/samples-typescript/tree/main/.shared) are copied into each sample directory, overwriting the sample directory's config files (with a few exceptions listed in [`.scripts/copy-shared-files.mjs`](./.scripts/copy-shared-files.mjs)). So if you're editing config files, you usually want to be editing the versions in `.shared/`.

The [`.post-create`](./.shared/.post-create) file is a [chalk template](https://github.com/chalk/chalk-cli#template-syntax) that is displayed in the command line after someone uses [`npx @temporalio/create`](https://docs.temporal.io/typescript/package-initializer). If you're adding a sample that requires different instructions from the default message, then add your sample name to [`POST_CREATE_EXCLUDE`](./.scripts/copy-shared-files.mjs) and your message template to `your-sample/.post-create`.
