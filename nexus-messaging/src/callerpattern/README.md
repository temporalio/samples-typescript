## Caller pattern

The handler worker starts a `GreetingWorkflow` for a user ID at boot.
`nexusGreetingServiceHandler` derives the workflow ID and routes every Nexus operation to it.
The caller's input does not have that workflow ID as the caller doesn't know it -- but the caller sends in the User ID,
and `nexusGreetingServiceHandler` knows how to get the desired workflow ID from that User ID (via the `GreetingWorkflow_for_<userId>` prefix).

The handler worker uses the same prefix to generate a workflow ID from a user ID when it launches the workflow.

The caller workflow:

1. Queries for supported languages (`getLanguages` -- backed by a query handler)
2. Queries the current language (`getLanguage`)
3. Changes the language to French (`setLanguage` -- backed by an update handler that calls an activity)
4. Approves the workflow (`approve` -- backed by a signal handler)

### Running

Start a compatible Temporal dev server with Workflow Update callbacks enabled:

```bash
./temporal server start-dev \
  --dynamic-config-value history.enableCHASMCallbacks=true \
  --dynamic-config-value history.enableUpdateCallbacks=true \
  --namespace nexus-messaging-handler-namespace \
  --namespace nexus-messaging-caller-namespace
```

This sample requires a Temporal dev-server build that supports Workflow Update callbacks. Download the compatible
binary from the [Temporal CLI pre-release instructions](https://docs.temporal.io/standalone-nexus-operation#temporal-cli-support).

Create the Nexus endpoint:

```bash
./temporal operator nexus endpoint create \
  --name nexus-messaging-nexus-endpoint \
  --target-namespace nexus-messaging-handler-namespace \
  --target-task-queue nexus-messaging-handler-task-queue
```

Install dependencies from the `nexus-messaging` directory:

```bash
pnpm install
```

In one terminal, start the handler worker:

```bash
npm run start.callerpattern.service
```

In a second terminal, start the caller worker:

```bash
npm run start.callerpattern.caller
```

In a third terminal, start the caller workflow:

```bash
npm run workflow.callerpattern
```

Expected output:

```
  languages: chinese, english
  current language: english
  set language to french, previous was: english
  approved
```
