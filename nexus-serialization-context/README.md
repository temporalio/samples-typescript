# Nexus serialization context

This sample uses `NexusSerializationContext` to select an encryption key for each Nexus
endpoint. The caller invokes synchronous and workflow-backed asynchronous operations
through four endpoints. The `compressed-encrypted` worker compresses and then encrypts
Nexus payloads. The `encrypted` worker encrypts without compression. Each handler selects
between its own key 1 and key 2 using the endpoint in the Nexus context.
The caller and each handler run in separate namespaces.

| Handler worker       | Endpoint                                     | Key ID                   | Nexus payload encoding |
| -------------------- | -------------------------------------------- | ------------------------ | ---------------------- |
| Compressed/encrypted | `nexus-serialization-compressed-encrypted-1` | `compressed-encrypted-1` | zlib, then AES-GCM     |
| Compressed/encrypted | `nexus-serialization-compressed-encrypted-2` | `compressed-encrypted-2` | zlib, then AES-GCM     |
| Encrypted            | `nexus-serialization-encrypted-1`            | `encrypted-1`            | AES-GCM                |
| Encrypted            | `nexus-serialization-encrypted-2`            | `encrypted-2`            | AES-GCM                |

These four endpoint keys are distinct 128-bit AES keys. Compression runs before encryption;
decoding decrypts before decompressing. AES-GCM authenticates the ciphertext.
The encryption codec uses Node.js's AES-GCM implementation and `zlib` module.
Nexus supplies the endpoint context used to select them. The context also identifies the
service and operation, so a codec can select keys using those fields as well.

Each worker configures `NexusCodec` for its role. The codec keeps an endpoint-to-codec
map and a default for ordinary workflow payloads. The caller uses a separate key for its own input and
final result, keeping those payloads independent of the keys shared with Nexus handlers.
Each handler reuses its key 1 for backing workflow inputs.

| Ordinary workflow payload                    | Default key ID           |
| -------------------------------------------- | ------------------------ |
| Caller workflow input and final result       | `caller-workflow`        |
| Compressed/encrypted handler workflow inputs | `compressed-encrypted-1` |
| Encrypted handler workflow inputs            | `encrypted-1`            |

These workflow payloads use AES-GCM without compression or endpoint metadata.
An async Nexus result uses the key and compression selected by its endpoint,
even when that differs from the backing workflow's input encryption.

For synchronous operations, the SDK supplies Nexus context when decoding inputs and
encoding results. When an asynchronous handler starts `EchoWorkflow`, the SDK includes
the Nexus endpoint, service, and operation in the workflow-start request. The server
stores these fields in the `WorkflowExecutionStarted` history event. The worker SDK
restores the Nexus context from that event when encoding the workflow's result, so
`NexusCodec` can select the endpoint's codec and key from the worker's local configuration.
The workflow's input still uses ordinary workflow context; the default codec encrypts
it with that handler's key 1.

The caller starts all eight operations before waiting for their results. The SDK passes
`SerializationContext` directly to the codec's `encode` and `decode` methods. `NexusCodec`
keeps the endpoint selection local to each call and shares read-only configuration,
so operations for different endpoints do not change each other's encoding.
No custom interceptor or workflow-header propagation is required.

A workflow execution produces one serialized result, shared by all Nexus operations
attached to it. Operations that need differently encrypted results therefore need
separate workflow executions. This sample starts a backing workflow for each async
operation, using its Nexus request ID as the workflow ID suffix. Retrying the same
request uses the same workflow ID.

The outer encrypted payload includes `encoding`, `encryption-key-id`, and, for Nexus
payloads, `nexus-endpoint-name` metadata. For example:

```text
encoding: binary/nexus-aes-gcm
encryption-key-id: compressed-encrypted-1
nexus-endpoint-name: nexus-serialization-compressed-encrypted-1
```

These labels identify the key and endpoint; they do not contain the key material.
Ordinary workflow payloads have a key ID but no endpoint metadata or compression.

The AES-GCM codec and hard-coded keys are for this example. Use an established encryption
implementation and secure key storage for production.

## Prerequisites

Use Node.js 22 or newer, [pnpm](https://pnpm.io/installation), and Temporal TypeScript
SDK 1.26.0 or later. This SDK version supports native Nexus context propagation to
workflow-backed asynchronous results.

Use a Temporal Server that supports Nexus serialization-context propagation for
workflow-backed asynchronous operations. For local development, download
[Temporal CLI `v1.9.3-nexus-serialization-context`](https://github.com/temporalio/cli/releases/tag/v1.9.3-nexus-serialization-context).
Extract it and place the `temporal` executable in this sample directory. The commands
below use `./temporal` to run this build separately from your installed CLI.

## Run locally

From the repository root, enter the sample directory and install its dependencies:

```shell
cd nexus-serialization-context
pnpm install
./temporal --version
```

The CLI should report `1.9.3-nexus-serialization-context`. Run the remaining commands
from `nexus-serialization-context`, including commands in new terminals.

The caller and each handler use separate namespaces. Each worker polls a task queue
with the same name as its namespace. Both endpoints for a handler target that handler's
namespace and task queue.

| Worker                       | Namespace and task queue                           |
| ---------------------------- | -------------------------------------------------- |
| Caller                       | `nexus-serialization-caller`                       |
| Compressed/encrypted handler | `nexus-serialization-compressed-encrypted-handler` |
| Encrypted handler            | `nexus-serialization-encrypted-handler`            |

Start the dev server in its own terminal and leave it running:

```shell
./temporal server start-dev \
  --namespace nexus-serialization-caller \
  --namespace nexus-serialization-compressed-encrypted-handler \
  --namespace nexus-serialization-encrypted-handler
```

In another terminal, create two endpoints for each handler worker:

```shell
./temporal operator nexus endpoint create \
  --name nexus-serialization-compressed-encrypted-1 \
  --target-namespace nexus-serialization-compressed-encrypted-handler \
  --target-task-queue nexus-serialization-compressed-encrypted-handler
./temporal operator nexus endpoint create \
  --name nexus-serialization-compressed-encrypted-2 \
  --target-namespace nexus-serialization-compressed-encrypted-handler \
  --target-task-queue nexus-serialization-compressed-encrypted-handler
./temporal operator nexus endpoint create \
  --name nexus-serialization-encrypted-1 \
  --target-namespace nexus-serialization-encrypted-handler \
  --target-task-queue nexus-serialization-encrypted-handler
./temporal operator nexus endpoint create \
  --name nexus-serialization-encrypted-2 \
  --target-namespace nexus-serialization-encrypted-handler \
  --target-task-queue nexus-serialization-encrypted-handler
```

Run each worker in its own terminal and leave all three running alongside the server:

```shell
pnpm start.compressed
```

```shell
pnpm start.encrypted
```

```shell
pnpm start.caller
```

Start the caller workflow in another terminal:

```shell
pnpm workflow
```

The starter prints the workflow ID, followed by a sync result and an async result for
each endpoint. Replacing the generated ID, the output is:

```text
Started workflow: nexus-serialization-<workflow UUID>
nexus-serialization-compressed-encrypted-1: sync="Hello from Nexus" async="Hello from Nexus"
nexus-serialization-encrypted-1: sync="Hello from Nexus" async="Hello from Nexus"
nexus-serialization-compressed-encrypted-2: sync="Hello from Nexus" async="Hello from Nexus"
nexus-serialization-encrypted-2: sync="Hello from Nexus" async="Hello from Nexus"
```

All eight results should be `Hello from Nexus`. The starter exits when they are available;
the workers and server keep running. The run creates five workflow executions: one caller
and four async backing workflows. The four sync operations return directly from their handlers.

## Test

Run the codec and workflow tests:

```shell
pnpm test
pnpm lint
pnpm build
```

The workflow test starts an isolated server on private ports using the same CLI build
and checks the stored Nexus context and the backing workflows' input and result metadata.
Set `TEMPORAL_CLI_PATH` to use this CLI build from another location.
