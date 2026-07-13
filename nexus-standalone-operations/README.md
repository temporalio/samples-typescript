# Nexus Standalone Operations

This sample demonstrates how to execute Nexus Operations directly from client code, without wrapping them in a caller Workflow. It shows both synchronous and workflow-backed Operations, plus listing and counting standalone Nexus Operation executions.

The starter and worker connect to two different namespaces (a "caller" namespace and a "handler" namespace) — this mirrors how Nexus is typically used to cross namespace boundaries. The client is configured via the SDK's [environment configuration](https://docs.temporal.io/develop/environment-configuration) support (`loadClientConnectConfig()`), which reads `TEMPORAL_NAMESPACE`, `TEMPORAL_ADDRESS`, etc. from the environment (and optionally profiles from `temporal.toml`).

### Temporal Typescript SDK support for Standalone Nexus Operations is at [Pre-release](https://docs.temporal.io/evaluate/development-production-features/release-stages#pre-release).

All APIs are experimental and may be subject to backwards-incompatible changes.

Standalone Nexus operations require a server version that supports this feature. Use the dev server build at https://github.com/temporalio/cli/releases/tag/v1.7.4-standalone-nexus-operations.

## Structure

- `src/api.ts` - Defines the Nexus Service, including its input and output types.
- `src/shared.ts` - Shared constants (task queue and Nexus endpoint names).
- `src/worker/handler.ts` - Implements the synchronous `echo` Operation and the workflow-backed `hello` Operation.
- `src/worker/workflows.ts` - Defines the Workflow used by the `hello` Operation.
- `src/worker/worker.ts` - Runs the Worker that hosts the Nexus Service handler.
- `src/starter.ts` - Executes standalone Nexus Operations from a Temporal Client.

## Run locally against a dev server

Install dependencies first with `npm install` (or `pnpm` / `yarn`).

1. Start the [Temporal dev server build that supports standalone Nexus operations](https://docs.temporal.io/standalone-nexus-operation#temporal-cli-support) with the required namespaces pre-created:

   ```bash
   ./temporal server start-dev \
     --namespace my-caller-namespace \
     --namespace my-handler-namespace
   ```

2. Create a Nexus endpoint that routes to the handler namespace and the worker's task queue:

   ```sh
   ./temporal operator nexus endpoint create \
     --name my-nexus-endpoint \
     --target-namespace my-handler-namespace \
     --target-task-queue nexus-handler-queue
   ```

3. In a second shell, start the Worker in the handler namespace:

   ```sh
   TEMPORAL_NAMESPACE=my-handler-namespace npm run worker
   ```

4. In a third shell, run the starter in the caller namespace:

   ```sh
   TEMPORAL_NAMESPACE=my-caller-namespace npm run starter
   ```

Example output:

```
Echo result: hello
Echo result from existing operation handle: hello

Started myNexusService.hello. Operation ID: hello-...
myNexusService.hello result: Hello, World!

Listing Nexus operations:
  Operation ID: hello-..., Operation: hello, Status: COMPLETED
  Operation ID: echo-..., Operation: echo, Status: COMPLETED

Total Nexus operations: 2
```

If you run the starter multiple times, the listing and count will include additional Operations for the endpoint.

## Run against Temporal Cloud

1. Create two namespaces in Temporal Cloud (for example `my-caller-namespace.<account>` and `my-handler-namespace.<account>`) and generate an API key (or mTLS cert) that can access both.

2. Create a Nexus endpoint that targets the handler namespace and the worker's task queue. See the Temporal Cloud instructions at https://docs.temporal.io/nexus/registry#create-a-nexus-endpoint. Use:
   - Endpoint name: `my-nexus-endpoint`
   - Target namespace: `my-handler-namespace.<account>`
   - Target task queue: `nexus-handler-queue`
   - Allowed caller namespaces: include `my-caller-namespace.<account>` (endpoints reject callers that are not on this list)

3. Add two profiles to your [environment configuration file](https://docs.temporal.io/develop/environment-configuration), one per namespace. Using API keys:

   ```toml
   [profile.handler]
   address = "<region>.<cloud>.api.temporal.io:7233"
   namespace = "my-handler-namespace.<account>"
   api_key = "<your-api-key>"

   [profile.caller]
   address = "<region>.<cloud>.api.temporal.io:7233"
   namespace = "my-caller-namespace.<account>"
   api_key = "<your-api-key>"
   ```

   For mTLS instead of API keys, set `tls.client_cert_path` and `tls.client_key_path` on each profile (see the [docs](https://docs.temporal.io/develop/environment-configuration) for the full schema).

4. Run the Worker and starter in separate shells, selecting the appropriate profile in each:

   ```sh
   # terminal 1 (worker, handler namespace)
   TEMPORAL_PROFILE=handler npm run worker
   ```

   ```sh
   # terminal 2 (starter, caller namespace)
   TEMPORAL_PROFILE=caller npm run starter
   ```
