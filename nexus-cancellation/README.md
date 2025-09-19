# Temporal+Nexus RPC Cancellation Sample

This sample demonstrates:

- How to cancel a Nexus Operation from a caller workflow;
- How to use `CancellationScope` for granular control over Nexus Operation cancellation;
- How to handle cancellation signals in workflows;
- How to start Nexus Operations with handles for cancellation control;
- How to implement cancellable Nexus Operations that can be interrupted gracefully.

## Structure

- `src/api.ts` - Defines the Nexus Service, including its input and output types.
- `src/caller/` - Sample Workflows that demonstrate Nexus Operation cancellation patterns.
  - `workflows.ts` - Contains `cancellableCallerWorkflow` that shows how to cancel Nexus Operations.
- `src/service/` - The Nexus Service handler, together with a Workflow used by the Nexus Operations.
- `src/starter.ts` - Starter code that demonstrates both normal completion and cancellation scenarios.

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

--- Testing cancellable workflow (normal completion) ---
Completed message: Hello, Temporal!

--- Testing cancellable workflow (with cancellation) ---
Started cancellable workflow: workflow-cancelled-A1B2C3D4
Workflow was cancelled as expected: NexusOperationFailure: ...
```

## Key Concepts

### Cancellation Scope

The `CancellationScope` allows you to create a boundary around operations that can be cancelled together:

```typescript
const cancellableScope = new wf.CancellationScope({ cancellable: true });
const nexusOperationHandle = await cancellableScope.run(async () =>
  nexusClient.startOperation('hello', { name, language }, { scheduleToCloseTimeout: '60s' }),
);
```

### Handling Cancellation Results

When a Nexus Operation is cancelled, it throws a `NexusOperationFailure` with a `CancelledFailure` as the cause:

```typescript
try {
  return await nexusOperationHandle.result();
} catch (error) {
  // Handle cancellation gracefully
}
```
