## Caller pattern

The handler worker starts a `GreetingWorkflow` for a user ID at boot.
`NexusGreetingService` holds that ID and routes every Nexus operation to it.
The caller's input does not have that workflow ID as the caller doesn't know it -- but the caller sends in the User ID,
and `NexusGreetingService` knows how to get the desired workflow ID from that User ID (via the `GreetingWorkflow_for_<userId>` prefix).

The handler worker uses the same prefix to generate a workflow ID from a user ID when it launches the workflow.

The caller workflow:

1. Queries for supported languages (`getLanguages` -- backed by a query handler)
2. Queries the current language (`getLanguage`)
3. Changes the language to French (`setLanguage` -- backed by an update handler that calls an activity)
4. Approves the workflow (`approve` -- backed by a signal handler)

### Running

Start a Temporal server:

```bash
temporal server start-dev
```

Create the namespaces and Nexus endpoint:

```bash
temporal operator namespace create --namespace nexus-messaging-handler-namespace
temporal operator namespace create --namespace nexus-messaging-caller-namespace

temporal operator nexus endpoint create \
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
