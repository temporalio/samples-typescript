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
    - [Nexus APIs](#nexus-apis)
    - [Workflow APIs](#workflow-apis)
    - [Production APIs](#production-apis)
    - [Advanced APIs](#advanced-apis)
    - [Test APIs](#test-apis)
  - [Full-stack apps](#full-stack-apps)
- [External apps & libraries](#external-apps--libraries)
- [Contributing](#contributing)
  - [Dependencies](#dependencies)
  - [Upgrading the SDK version in `package.json`s](#upgrading-the-sdk-version-in-packagejsons)
  - [Config files](#config-files)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

Each directory in this repo is a sample Temporal project built with the [TypeScript SDK](https://github.com/temporalio/sdk-typescript/) (see [docs](https://docs.temporal.io/application-development?lang=typescript#supported-sdks) and [API reference](https://typescript.temporal.io/)).

## Running

### In browser

The fastest way to try out these samples is running them in the browser:

- Gitpod: [One click to try](https://gitpod.io/#https://github.com/temporalio/samples-typescript/) (there is a good free tier)
- [GitHub Codespaces](https://docs.github.com/en/codespaces/developing-in-codespaces/creating-a-codespace#creating-a-codespace) (if your org admin has enabled this) - [90 second video demo](https://youtu.be/FdEQQC9EdfU)

### Locally

Run Temporal Server:

```sh
brew install temporal
temporal server start-dev
```

(or use a [different installation method](https://github.com/temporalio/cli/#-install))

Use Node version 18+ (v22.x is recommended):

- Mac: `brew install node@22`
- Other: [nodejs.org/en/download/](https://nodejs.org/en/download/)
- Or use a Node version manager: [`fnm`](https://github.com/Schniz/fnm#readme)

Run the [`hello-world`](./hello-world) sample:

```sh
git clone https://github.com/temporalio/samples-typescript.git
cd samples-typescript/hello-world
npm install  # or `pnpm` or `yarn`
npm run start
```

and in another terminal:

```sh
npm run workflow
```

> [!NOTE]
> Except when indicated otherwise, samples can be run using any package manager, e.g. `npm`,
> `yarn` or `pnpm`. Refer to individual README.md files for specific instructions.
>
> The root project itself is optimized for work with `pnpm`. Installing dependencies of the root project
> is not required, unless you plan to make contributions (see the [Contributing](#contributing) section
> below for more details).

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

- [**Basic hello world**](./hello-world): Simple example of a Workflow Definition and an Activity Definition.
  - Variant: [Basic hello world with mTLS](./hello-world-mtls) shows how to connect to your Temporal Cloud namespace with mTLS authentication.
- [**Pure ES Modules**](./fetch-esm): Configure Temporal with TypeScript and Pure ESM.
- [**JavaScript**](./hello-world-js): The Hello World sample in JavaScript instead of TypeScript.

### API demos

#### Activity APIs and design patterns

- [**Activities Examples**](./activities-examples):
  - `makeHTTPRequest`: Make an external HTTP request in an Activity (using `axios`).
  - `cancellableFetch`: Make a cancellable HTTP request with [`cancellationSignal`](https://typescript.temporal.io/api/namespaces/activity/#cancellation).
  - `doSomethingAsync`: Complete an Activity async with [`AsyncCompletionClient`](https://typescript.temporal.io/api/classes/client.AsyncCompletionClient/#complete).
- [**Activity Cancellation and Heartbeating**](./activities-cancellation-heartbeating): Heartbeat progress for long running activities and cancel them.
- [**Dependency Injection**](./activities-dependency-injection): Share dependencies between activities (for example, when you need to initialize a database connection once and then pass it to multiple activities).
- [**Worker-Specific Task Queues**](./worker-specific-task-queues): Use a unique task queue per Worker to have certain Activities only run on that specific Worker. For instance for a file processing Workflow, where the first Activity is downloading a file, and subsequent Activities need to operate on that file. (If multiple Workers were on the same queue, subsequent Activities may get run on different machines that don't have the downloaded file.)

#### Nexus APIs

- [**Nexus Hello**](./nexus-hello): Demonstrates how to define a Nexus Service, implement the Operation handlers, and call the Operations from a Workflow.
- [**Nexus Cancellation**](./nexus-cancellation): Demonstrates how to cancel a Nexus Operation from a caller workflow using a CancellationScope

#### Workflow APIs

- **Timers**:
  - The [**progress example**](./timer-progress) demonstrates how to use the `sleep` function from `@temporalio/workflow`.
  - [**Timer Examples**](./timer-examples):
    - Send a notification to the customer if their order is taking longer than expected (using a `Promise.race` between the order activity and `sleep`).
    - Create an `UpdatableTimer` that can be slept on, and at the same time, have its duration updated via Signals.
- **Signals and Triggers**:
  - The [**Signals and Queries example**](https://github.com/temporalio/samples-typescript/tree/main/signals-queries) demonstrates the usage of Signals, Queries, and Workflow Cancellation.
  - [**Mutex**](https://github.com/temporalio/samples-typescript/tree/main/mutex): Workflows send Signals to each other in this example of `lockWorkflow` acting as a mutex.
  - [**State**](https://github.com/temporalio/samples-typescript/tree/main/state): The Workflow maintains state in a `Map<string, number>`, and the state can be updated and read via a Signal and a Query.
  - **Async activity completion**: Example of an [**Expense reporting**](https://github.com/temporalio/samples-typescript/tree/main/expense) Workflow that communicates with a server API. Shows how to kick off a Workflow and manually complete it at an arbitrarily later date.
- [**Schedules**](https://github.com/temporalio/samples-typescript/tree/main/schedules): Schedule Workflows.
- [**Cron Workflows**](https://github.com/temporalio/samples-typescript/tree/main/cron-workflows): Schedule a cron job. _DEPRECATED: use [Schedules](https://github.com/temporalio/samples-typescript/tree/main/schedules) instead._
- [**Child Workflows**](https://github.com/temporalio/samples-typescript/tree/main/child-workflows): Start and control Child Workflows.
- [**Infinite Workflows**](https://github.com/temporalio/samples-typescript/tree/main/continue-as-new): Use the `continueAsNew` API for indefinitely long running Workflows.
- [**Search Attributes**](https://github.com/temporalio/samples-typescript/tree/main/search-attributes): Create, set, upsert, and read Search Attributes.

- [**Subscriptions**](https://github.com/temporalio/subscription-workflow-project-template-typescript/)

#### Production APIs

- [**Production Build**](./production): Build code in advance for faster Worker startup times.
- [**Debugging**](https://docs.temporal.io/dev-guide/typescript/debugging): The [vscode-debugger](./vscode-debugger) sample shows how to use the Temporal VS Code plugin to debug a running or completed Workflow Execution.
- [**Patching**](https://docs.temporal.io/workflows/#workflow-versioning): Patch in new Workflow code when making updates to Workflows that have executions in progress in production.
- [**Custom Logger**](./custom-logger): Use a [winston](https://github.com/winstonjs/winston) logger to get logs out of all SDK components.
- [**Sinks**](./sinks): Use Sinks to extract data out of Workflows for alerting/logging/metrics/tracing purposes.
- [**Worker Versioning**](./worker-versioning): Version Workers with Build IDs in order to deploy incompatible changes to Workflow code.
- [**Protobufs**](./protobufs): Use [Protobufs](https://docs.temporal.io/security/#default-data-converter).
- [**Custom Payload Converter**](./ejson): Customize data serialization by creating a `PayloadConverter` that uses EJSON to convert Dates, binary, and regexes.
- **Monorepos**:
  - [`/monorepo-folders`](./monorepo-folders): yarn workspace with packages for a web frontend, API server, Worker, and Workflows/Activities.
  - [`psigen/temporal-ts-example`](https://github.com/psigen/temporal-ts-example): yarn workspace containerized with [tilt](https://tilt.dev/). Includes `temporalite`, `parcel`, and different packages for Workflows and Activities.
- [**Polyglot**](https://github.com/temporalio/temporal-pendulum): Use TS alongside other languages

#### Advanced APIs

- **Interceptors**:
  - [**OpenTelemetry**](./interceptors-opentelemetry): Use the Interceptors feature to add OpenTelemetry metrics reporting to your workflows.
  - [**Query Subscriptions**](./query-subscriptions): Use Redis Streams, Immer, and SDK Interceptors to subscribe to Workflow state.
- [**gRPC calls**](./grpc-calls): Make raw gRPC calls for advanced queries not covered by the WorkflowClient API.

#### Test APIs

- [**Mocha with code coverage or Jest**](https://github.com/temporalio/samples-typescript/tree/main/activities-examples#testing)
- [**Time skipping**](https://github.com/temporalio/samples-typescript/tree/main/timer-examples#testing)

### Full-stack apps

- **Next.js**:
  - [**One-click e-commerce**](https://github.com/temporalio/samples-typescript/tree/main/nextjs-ecommerce-oneclick): Buy an item with one click, and the Workflow will wait 5 seconds to see if the user cancels before it executes the order.
  - [**Food delivery**](https://github.com/temporalio/samples-typescript/tree/main/food-delivery): Multi-step business process with Signals, Queries, Activities, timeouts, and List Workflow API. Turborepo monorepo with 2 Next.js apps and a tRPC API.

## External apps & libraries

_The below projects are maintained outside this repo and may not be up to date._

- **LLM**:
  - [`lorensr/ai-group-chat`](https://github.com/lorensr/ai-group-chat): `groupChat` workflow that maintains chat state and gets chat messages from OpenAI's API. Turborepo monorepo with Next.js and GraphQL federation.
- **Express**:
  - [`vkarpov15/temporal-ecommerce-ts`](https://github.com/vkarpov15/temporal-ecommerce-ts): The `cartWorkflow` used in [this blog series](https://learn.temporal.io/tutorials/go/ecommerce/)
  - [`temporal-rest`](https://www.npmjs.com/package/temporal-rest): Express middleware router that automatically exposes endpoints for Workflows, Signals, and Queries.
- **Remix**:
  - [`gustavofsantos/temporal-survey`](https://github.com/gustavofsantos/temporal-survey)
- **NestJS**:
  - [`nestjs-temporal`](https://www.npmjs.com/package/nestjs-temporal)
- **Chatbots**:
  - [`JoshuaKGoldberg/temporal-adventure-bot`](https://github.com/JoshuaKGoldberg/temporal-adventure-bot): Choose-your-own-adventure Slack/Discord chatbot (see [tutorial](https://learn.temporal.io/tutorials/typescript/chatbot/) and [video](https://www.youtube.com/watch?v=hGIhc6m2keQ))
- **Caching**:
  - [`vkarpov15/temporal-api-caching-example`](https://github.com/vkarpov15/temporal-api-caching-example/): Cache data from a third-party API (see [blog post](https://temporal.io/blog/caching-api-requests-with-long-lived-workflows))
- **DSL Control Flows**:
  - [**YAML DSL Interpreter**](./dsl-interpreter): Make Workflows interpret a custom YAML-based Domain Specific Language of your design.
  - [**XState Interpreter**](https://github.com/Devessier/temporal-electronic-signature): Interpret XState state charts in a Workflow. Presented at [the November 2021 meetup](https://youtu.be/GpbOkDjpeYU?t=1616).
- **URL Scraping**
  - [`andreasasprou/temporal-url-batch-scraping`](https://github.com/andreasasprou/temporal-url-batch-scraping)
- **Nx Monorepo**
  - [`nubunto/nx-with-temporal`](https://github.com/nubunto/nx-with-temporal/tree/main)

## Contributing

External contributions are very welcome! 🤗 (Big thank you to those who have [already contributed](https://github.com/temporalio/samples-typescript/graphs/contributors) 🙏)

Before submitting a major PR, please find consensus on it in [Issues](https://github.com/temporalio/samples-typescript/issues).

To get started developing, run:

```bash
git clone https://github.com/temporalio/samples-typescript.git
cd samples-typescript
pnpm install
pnpm run prepare
```

Prettier and ESLint are run on each commit, but you can also run them manually:

```sh
pnpm run format
pnpm run lint
```

> [!NOTE]
> To **reset** your environment in the event that it is broken, consider running:
> ```
> git clean -xfd && rm pnpm-lock.yaml
> ```
> in the root directory</br>
> **Warning**: this may result in losing work-in-progress (i.e. untracked files).

### Dependencies

- The docs and tutorials depend on `SNIPSTART` and `SNIPEND` comments in samples. Make sure to search through the [docs](https://github.com/temporalio/documentation/) and [learn](https://github.com/temporalio/temporal-learning) repos to make sure a snippet is unused before removing it.
- There are [blog posts](https://temporal.io/blog/building-reliable-distributed-systems-in-node) and a PDF that depend on the file structure of the `food-delivery/` sample.

### Upgrading the SDK version in `package.json`s

```sh
pnpm run upgrade-versions -- 'VERSION_STRING_HERE'
pnpm run format
```

### Config files

Also on each commit, config files from [`.shared/`](./.shared) are copied into each sample directory, overwriting the sample directory's config files (with a few exceptions listed in [`.scripts/copy-shared-files.mjs`](./.scripts/copy-shared-files.mjs)). So if you're editing config files, you usually want to be editing the versions in `.shared/`.

The [`.post-create`](./.shared/.post-create) file is a [chalk template](https://github.com/chalk/chalk-cli#template-syntax) that is displayed in the command line after someone uses [`npx @temporalio/create`](https://learn.temporal.io/tutorials/typescript/subscriptions/#create-the-project). If you're adding a sample that requires different instructions from the default message, then add your sample name to [`POST_CREATE_EXCLUDE`](./.scripts/copy-shared-files.mjs) and your message template to `your-sample/.post-create`.
