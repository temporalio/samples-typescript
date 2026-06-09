# Nexus Standalone Operations

This sample demonstrates how to execute Nexus Operations directly from client code, without wrapping them in a caller Workflow. It shows both synchronous and workflow-backed Operations, plus listing and counting standalone Nexus Operation executions.

### Temporal Typescript SDK support for Standalone Nexus Operations is at [Pre-release](https://docs.temporal.io/evaluate/development-production-features/release-stages#pre-release).

All APIs are experimental and may be subject to backwards-incompatible changes.

Standalone Nexus operations require a server version that supports this feature. Use the dev server build at https://github.com/temporalio/cli/releases/tag/v1.7.2-standalone-nexus-operations.

## Structure

- `src/api.ts` - Defines the Nexus Service, including its input and output types.
- `src/service/handler.ts` - Implements the synchronous `echo` Operation and the workflow-backed `hello` Operation.
- `src/service/workflows.ts` - Defines the Workflow used by the `hello` Operation.
- `src/service/worker.ts` - Runs the Worker that hosts the Nexus Service handler.
- `src/starter.ts` - Executes standalone Nexus Operations from a Temporal Client.

## Prerequisites

Start a Temporal dev server with the dynamic config flags required for standalone Nexus operations:

```bash
temporal server start-dev \
  --dynamic-config-value "nexusoperation.enableStandalone=true" \
  --dynamic-config-value "history.enableChasmCallbacks=true"
```

## Running the sample

1. Install NPM dependencies:

   ```sh
   npm install   # or `pnpm` or `yarn`
   ```

2. Start a compatible Temporal Server on `localhost:7233`.

3. Create the Nexus endpoint:

   ```sh
   temporal operator nexus endpoint create \
     --name nexus-standalone-operations-endpoint \
     --target-namespace default \
     --target-task-queue nexus-standalone-operations
   ```

4. In one shell, start the Worker:

   ```sh
   npm run start.worker
   ```

5. In another shell, execute the sample:

   ```sh
   npm run starter
   ```

Example output:

```
Echo result: hello

Started myNexusService.hello. Operation ID: hello-...
myNexusService.hello result: Hello, World!

Listing Nexus operations:
  Operation ID: hello-..., Operation: hello, Status: COMPLETED
  Operation ID: echo-..., Operation: echo, Status: COMPLETED

Total Nexus operations: 2
```

If you run the starter multiple times, the listing and count will include additional Operations for the endpoint.
