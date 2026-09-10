## On-demand pattern

No workflow is pre-started. The caller creates and controls workflow instances through Nexus
operations. `NexusRemoteGreetingService` adds a `runFromRemote` operation that starts a new
`GreetingWorkflow`, and every other operation includes a `workflowId` so the handler knows which
instance to target.

The caller workflow:

1. Attaches approval context for user one via `attachApprovalContext`, before anything has started
   that user's workflow
2. Starts or attaches to two remote `GreetingWorkflow` instances via `runFromRemote` (backed by `TemporalOperation`)
3. Attaches approval context for user two, whose workflow now already exists
4. Queries supported languages from workflow one and the current language from workflow two
5. Changes the language on each (Spanish and Hindi)
6. Approves both workflows
7. Waits for each to complete and returns their results

### Running

Start a compatible Temporal dev server with Workflow Update callbacks enabled:

```bash
./temporal server start-dev \
  --dynamic-config-value history.enableCHASMCallbacks=true \
  --dynamic-config-value history.enableUpdateCallbacks=true \
  --dynamic-config-value history.enableCHASMSignalBacklinks=true \
  --dynamic-config-value history.enableSignalWithStartFromWorkflow=true \
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
npm run start.ondemandpattern.service
```

In a second terminal, start the caller worker:

```bash
npm run start.ondemandpattern.caller
```

In a third terminal, start the caller workflow:

```bash
npm run workflow.ondemandpattern
```

Expected output:

```
  attached approval context for user: UserId_One
  started workflow one for user: UserId_One
  started workflow two for user: UserId_Two
  attached approval context to running workflow for user: UserId_Two
  workflow one languages: chinese, english
  workflow one: set language to spanish, previous was: english
  workflow two current language: english
  workflow two: set language to hindi, previous was: english
  approved both workflows
  workflow one result: Hola, mundo
  workflow two result: नमस्ते दुनिया
```
