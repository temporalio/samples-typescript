# Nexus Operation backed by a standalone Activity

This sample demonstrates how a Nexus Operation implemented with a `TemporalOperationHandler` can start a standalone Activity. The starter invokes the Nexus Operation directly from a Temporal Client, the handler starts the Activity, and the Activity result completes the Operation.

These APIs are experimental and may change in future releases.

## Structure

- `src/api.ts` defines the Nexus Service and its typed input and output.
- `src/activities.ts` implements the Activity that backs the Nexus Operation.
- `src/handler.ts` implements the Operation with `TemporalOperationHandler` and starts the standalone Activity through its typed Activity client.
- `src/worker.ts` runs a Worker that handles both Nexus and Activity tasks.
- `src/starter.ts` starts the Nexus Operation directly from a Temporal Client.

## Run locally

This sample requires the [Temporal CLI build with standalone Nexus Operations](https://github.com/temporalio/cli/releases/tag/v1.7.4-standalone-nexus-operations), with Activity callbacks enabled as shown below.

1. Install dependencies from this directory:

   ```sh
   pnpm install
   ```

2. Start the Temporal dev server with the two namespaces and required feature flags:

   ```sh
   temporal server start-dev \
     --namespace default \
     --namespace greeting-handler \
     --dynamic-config-value activity.enableCallbacks=true
   ```

3. Create a Nexus endpoint that routes to the handler Worker:

   ```sh
   temporal operator nexus endpoint create \
     --name greeting-endpoint \
     --target-namespace greeting-handler \
     --target-task-queue greeting-handler-task-queue
   ```

4. In a second shell, start the Worker:

   ```sh
   TEMPORAL_NAMESPACE=greeting-handler pnpm run worker
   ```

5. In a third shell, run the starter from the caller namespace:

   ```sh
   TEMPORAL_NAMESPACE=default pnpm run starter
   ```

Expected output:

```text
Hello, Temporal!
```
