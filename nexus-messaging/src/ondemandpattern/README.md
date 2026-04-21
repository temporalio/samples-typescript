## On-demand pattern

No workflow is pre-started. The caller creates and controls workflow instances through Nexus
operations. `NexusRemoteGreetingService` adds a `runFromRemote` operation that starts a new
`GreetingWorkflow`, and every other operation includes a `workflowId` so the handler knows which
instance to target.

The caller workflow:

1. Starts two remote `GreetingWorkflow` instances via `runFromRemote` (backed by `WorkflowRunOperation`)
2. Queries supported languages from workflow one and the current language from workflow two
3. Changes the language on each (Spanish and Hindi)
4. Approves both workflows
5. Waits for each to complete and returns their results

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
  started workflow one for user: UserId_One
  started workflow two for user: UserId_Two
  workflow one languages: chinese, english
  workflow one: set language to spanish, previous was: english
  workflow two current language: english
  workflow two: set language to hindi, previous was: english
  approved both workflows
  workflow one result: Hola, mundo
  workflow two result: नमस्ते दुनिया
```
