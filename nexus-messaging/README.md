# Nexus Messaging Sample

This sample demonstrates how to expose a long-running workflow's queries, updates, and signals as
[Temporal Nexus](https://docs.temporal.io/nexus) operations. It contains two sub-examples that share
the same npm package.

## Overview

### Namespaces and endpoint

| Resource                | Value                                  |
| ----------------------- | -------------------------------------- |
| Handler namespace       | `nexus-messaging-handler-namespace`    |
| Caller namespace        | `nexus-messaging-caller-namespace`     |
| Nexus endpoint          | `nexus-messaging-nexus-endpoint`       |
| Handler task queue      | `nexus-messaging-handler-task-queue`   |

Install NPM dependencies:

   ```sh
   npm install   # or `pnpm` or `yarn`
   ```
   
Make sure you have a local [Temporal Server](https://github.com/temporalio/cli/#installation) running:

   ```sh
   temporal server start-dev
   ```

Create the expected namespaces:

```bash
temporal operator namespace create --namespace nexus-messaging-handler-namespace
temporal operator namespace create --namespace nexus-messaging-caller-namespace
```

The Nexus endpoint must be created in Temporal Cloud or your local `temporal` CLI before running:

```sh
temporal operator nexus endpoint create \
  --name nexus-messaging-nexus-endpoint \
  --target-namespace nexus-messaging-handler-namespace \
  --target-task-queue nexus-messaging-handler-task-queue
```

---

## Sub-example 1: Entity pattern (`callerpattern`)

The handler worker pre-starts a `GreetingWorkflow` entity for each known user at boot time.
`NexusGreetingService` exposes four synchronous operations that map a `userId` to the workflow via
the ID prefix `GreetingWorkflow_for_<userId>`:

| Operation      | Mechanism                        | Description                              |
| -------------- | -------------------------------- | ---------------------------------------- |
| `getLanguages` | Query `getLanguages`             | Returns all languages with a greeting    |
| `getLanguage`  | Query `getLanguage`              | Returns the current greeting language    |
| `setLanguage`  | Update `setLanguage`             | Changes the language; fetches via activity if unknown |
| `approve`      | Signal `approve`                 | Completes the entity workflow            |

`CallerWorkflow` takes a `userId`, calls all four operations in sequence, and returns a `string[]` log.

### Run

Open three terminals. Make sure each of them is in the nexus-messaging directory and run the following commands:

```sh
# Terminal 1 – handler worker (starts entity workflows at boot)
npm run start.callerpattern.service

# Terminal 2 – caller worker
npm run start.callerpattern.caller

# Terminal 3 – start the caller workflow
npm run workflow.callerpattern
```

Expected output:

```
  languages: chinese, english
  current language: english
  set language to french, previous was: english
  approved
```
---

## Sub-example 2: On-demand pattern (`ondemandpattern`)

No workflow is pre-started. `NexusRemoteGreetingService` exposes five operations:

| Operation       | Mechanism                                         | Description                              |
| --------------- | ------------------------------------------------- | ---------------------------------------- |
| `runFromRemote` | Async `WorkflowRunOperation`                      | Starts a new `GreetingWorkflow`          |
| `getLanguages`  | Query `getLanguages`                              | Returns all languages with a greeting    |
| `getLanguage`   | Query `getLanguage`                               | Returns the current greeting language    |
| `setLanguage`   | Update `setLanguage`                              | Changes the language                     |
| `approve`       | Signal `approve`                                  | Completes the workflow                   |

`CallerRemoteWorkflow` starts **two** remote `GreetingWorkflow` instances concurrently
(`UserId One` and `UserId Two`), interacts with both (query, set language, approve), and
waits for both results.

### Run

Open three terminals. Make sure each of them is in the nexus-messaging directory and run the following commands:

```sh
# Terminal 1 – handler worker
npm run start.ondemandpattern.service

# Terminal 2 – caller worker
npm run start.ondemandpattern.caller

# Terminal 3 – start the caller workflow
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

---

## Shared workflow: `GreetingWorkflow`

Both patterns use the same `GreetingWorkflow` design:

- **Initial greetings**: `{ chinese: "你好，世界", english: "Hello, world" }`
- **Supported languages**: `arabic`, `chinese`, `english`, `french`, `hindi`, `portuguese`, `spanish`
- Waits for the `approve` signal and all handlers to finish before returning the current greeting.
- The `setLanguage` update calls a `callGreetingService` activity to change the current greeting
