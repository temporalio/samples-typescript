# Temporal+Nexus RPC Hello World

This sample demonstrates:

- How to define a Nexus Service;
- How to call a Nexus Operation from a Workflow;
- How to implement a Nexus Operation handler using the Synchronous handler form;
- How to implement a Nexus Operation handler that starts a Temporal Workflow;
- How to use Nexus to make calls across Temporal namespaces.

## Structure

- `src/api.ts` - Defines the Nexus Service, including its input and output types.
- `src/caller/` - Sample Workflows that call the Nexus Operations.
- `src/service/` - The Nexus Service handler, together with a Workflow used by one of the Nexus Operations.
- `src/starter.ts` - Starter code, to run the Workflow.

## Prerequisites

Instructions below assume the following:

- [Install the latest Temporal CLI](https://learn.temporal.io/getting_started/typescript/dev_environment/#set-up-a-local-temporal-service-for-development-with-temporal-cli) (`v1.4.1` or higher recommended)
- [Install the latest Temporal TypeScript SDK](https://learn.temporal.io/getting_started/typescript/dev_environment/#add-temporal-typescript-sdk-dependencies) (`v1.13.0` or higher)

:::tip SUPPORT, STABILITY, and DEPENDENCY INFO

Temporal TypeScript SDK support for Nexus is at [Pre-release](https://docs.temporal.io/evaluate/development-production-features/release-stages#pre-release).

All APIs are experimental and may be subject to backwards-incompatible changes.

:::

## Running the sample

### Preparation

1. Install NPM dependencies:

   ```sh
   npm install   # or `pnpm` or `yarn`
   ```

2. Make sure you have a local [Temporal Server](https://github.com/temporalio/cli/#installation) running:

   ```sh
   temporal server start-dev --port 7233
   ```

3. Create the expected namespaces:

```bash
temporal operator namespace create --namespace my-caller-namespace
temporal operator namespace create --namespace my-target-namespace
```

4. Setup the Nexus Endpoint on the caller namespace:

```bash
temporal operator nexus endpoint create \
  --name my-nexus-endpoint-name \
  --target-namespace my-target-namespace \
  --target-task-queue my-handler-task-queue
```

### Execution

1. Run `npm run start.service` to start the Worker that will be serving the Nexus Operation handlers and its associated Workflows. That Worker connects to the `my-target-namespace` namespace.

2. In another shell, run `npm run start.caller` to start the Worker that will be serving the Caller Workflows. That Worker connects to the `my-caller-namespace` namespace.

3. In a third shell, `npm run workflow` to start an instance of the caller Workflows.

Example output:

```bash
Echo message: This message is from the client
Hello message: Hello, Temporal!
```
