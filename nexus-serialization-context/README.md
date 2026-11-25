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

Each endpoint uses a different 128-bit AES key. Compression runs before encryption,
and decoding decrypts before decompressing. AES-GCM authenticates the ciphertext.
The encryption codec uses Node.js's AES-GCM implementation and `zlib` module.
Nexus supplies the endpoint context used to select a codec. The context also identifies
the service and operation, which can be used to select keys.

## Adapt this pattern

`NexusCodec` accepts a map of endpoint names to payload codecs and a fallback codec
for ordinary workflow payloads. It delegates encoding and decoding to the selected
codec, passing through the serialization context. For example:

```typescript
const endpointCodecs = new Map<string, PayloadCodec>();
endpointCodecs.set('my-endpoint', myEndpointCodec);
const codec = new NexusCodec(endpointCodecs, myExistingWorkflowCodec);
```

Add this routing codec to `dataConverter.payloadCodecs` in the caller and handler
`Client` and `Worker` options. Unknown Nexus endpoints are rejected rather than
falling back to the workflow codec.

See [src/codec.ts](src/codec.ts) for routing and the demonstration `EncryptionCodec`,
[src/codec-config.ts](src/codec-config.ts) for the sample's endpoint maps and keys,
and [src/handler/worker.ts](src/handler/worker.ts) for worker setup.

Because AES-GCM uses symmetric encryption, the caller and handler share a secret key
for each endpoint. This sample uses that key for both requests and results.
Both sides also need the same payload format, including whether to compress.

The caller uses a separate key for its workflow input and final result.
For this example, each handler reuses its endpoint-1 key for backing workflow inputs.

When adapting this sample, use your existing codec for ordinary workflow payloads
so workers can still read existing histories. Pass it as the second argument to
`NexusCodec`; `select` returns it for non-Nexus contexts in [src/codec.ts](src/codec.ts).

| Ordinary workflow payload                              | Default key ID           |
| ------------------------------------------------------ | ------------------------ |
| Caller workflow input and final result                 | `caller-workflow`        |
| Compressed/encrypted handler's backing workflow inputs | `compressed-encrypted-1` |
| Encrypted handler's backing workflow inputs            | `encrypted-1`            |

These workflow payloads use AES-GCM without compression or endpoint metadata.

On decode, the AES-GCM codec passes other encodings through for ordinary decoding.
For AES-GCM payloads, it checks the key ID against the codec selected by context and
verifies the ciphertext before returning the decoded value.

The SDK supplies Nexus context for operation requests and results. For workflow-backed
async operations, the server stores the context in workflow history and the SDK uses it
to select the result's key and compression. To see the two keys in one execution, call
`nexus-serialization-encrypted-2` and check the backing workflow's history. Its input
records `encrypted-1` and its result records `encrypted-2`.

The caller starts all eight operations before waiting for their results. Each operation
keeps its own endpoint context while calls using different keys run concurrently.
The SDK passes context to each codec call, so endpoint selection stays local to that call.
No custom interceptor or workflow-header propagation is required.

Each workflow execution has one serialized result, shared by all Nexus operations
attached to it. Operations that need results encrypted with different keys must use
separate workflow executions. This sample starts one backing workflow per async
operation, using the Nexus request ID as its workflow ID suffix. Retrying the same
request reuses that workflow ID.

The outer encrypted payload includes `encoding`, `encryption-key-id`, and, for Nexus
payloads, `nexus-endpoint-name` metadata. For example:

```text
encoding: binary/nexus-aes-gcm
encryption-key-id: compressed-encrypted-1
nexus-endpoint-name: nexus-serialization-compressed-encrypted-1
```

The metadata identifies the key and endpoint. The key material stays in the codec
configuration.

The AES-GCM codec and hard-coded keys are for this example. For production, use an
established encryption implementation and secure key storage.

## Prerequisites

Use Node.js 22 or newer, [pnpm](https://pnpm.io/installation), and Temporal TypeScript
SDK 1.26.0 or later.

Use a Temporal Server that supports Nexus serialization-context propagation for
workflow-backed asynchronous operations. For the local walkthrough, download the prerelease
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

Each worker polls a task queue with the same name as its namespace. Both endpoints
for a handler target that handler's namespace and task queue.

| Worker                       | Namespace and task queue                           |
| ---------------------------- | -------------------------------------------------- |
| Caller                       | `nexus-serialization-caller`                       |
| Compressed/encrypted handler | `nexus-serialization-compressed-encrypted-handler` |
| Encrypted handler            | `nexus-serialization-encrypted-handler`            |

Start the dev server in its own terminal:

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

Run each worker in its own terminal:

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

### Output

Expected output:

```text
Started workflow: nexus-serialization-<workflow UUID>
nexus-serialization-compressed-encrypted-1: sync="Hello from Nexus" async="Hello from Nexus"
nexus-serialization-encrypted-1: sync="Hello from Nexus" async="Hello from Nexus"
nexus-serialization-compressed-encrypted-2: sync="Hello from Nexus" async="Hello from Nexus"
nexus-serialization-encrypted-2: sync="Hello from Nexus" async="Hello from Nexus"
```

All eight results should be `Hello from Nexus`.

The run creates five workflow executions: one caller and four async backing workflows.
The four sync operations return directly from their handlers.

## Test

Run the codec and workflow tests:

```shell
pnpm test
pnpm lint
pnpm build
```

The workflow test downloads the required CLI, starts its own server, and checks all eight
results, the stored Nexus context, and the backing workflows' input and result encryption
metadata. Set `TEMPORAL_CLI_PATH` to use an existing CLI executable instead.
