# External Storage

> **Experimental.** External storage shipped in SDK 1.21.0 and is marked experimental;
> its API may change.

Temporal stores every Workflow argument, Activity result, Signal, and heartbeat detail in
Workflow History, and enforces a size limit on each one. External storage moves the large
ones out: payloads over a size threshold are written to storage you control and replaced
on the wire by a small reference. The retrieving side resolves the reference before your
code ever sees it, so Workflow and Activity code stays unchanged.

This sample writes a **custom driver** end to end. It keeps payloads on the filesystem, so
a Client in one process can hand a 1 MiB argument to a Worker in another process without
either of them putting it in the Temporal database.

## How it works

`ExternalStorage` is configured on the `DataConverter`, on both the Client and the Worker:

```ts
new Client({
  connection,
  dataConverter: {
    externalStorage: new ExternalStorage({
      drivers: [new FileSystemStorageDriver({ rootDir })],
      payloadSizeThreshold: 32 * 1024,
    }),
  },
});
```

A driver is four members:

```ts
interface StorageDriver {
  readonly name: string; // routing key written into the reference; must match across processes
  readonly type: string; // stable implementation ID, reported via Worker heartbeat
  store(context, payloads): Promise<StorageDriverClaim[]>;
  retrieve(context, claims): Promise<Payload[]>;
}
```

The SDK handles the rest: it measures each payload, batches the over-threshold ones per
driver, calls `store`, and swaps in a reference carrying the driver name and the claim you
returned. Ordering is your contract to keep, one claim per payload. A claim is an opaque
`Record<string, string>`, and it lands in Workflow History, so keep it small and free of
secrets.

`store` receives a `target` describing the Workflow or Activity that produced the payloads
(namespace, ID, run ID, type), which this driver uses to lay out keys. If a driver throws,
the enclosing Workflow or Activity Task fails **retryably**, so transient I/O errors
recover on their own.

## Code

- [`filesystem-storage-driver.ts`](./src/filesystem-storage-driver.ts) — the custom driver.
  Content-addresses each payload by SHA-256, writes it atomically, verifies the hash on
  read, and refuses keys that escape the storage root. The comments cover the decisions
  and the alternatives at each one.
- [`data-converter.ts`](./src/data-converter.ts) — wires the driver into an
  `ExternalStorage`, with the size threshold and the multi-driver `driverSelector` option.
- [`workflows.ts`](./src/workflows.ts) — an ordinary Workflow. Documents which of its four
  payloads get offloaded, by whom, and when.
- [`activities.ts`](./src/activities.ts) — one Activity that takes and returns a large
  payload, one that takes a large payload and returns a small one.
- [`worker.ts`](./src/worker.ts) / [`client.ts`](./src/client.ts) — both sides configured.
- [`inspect.ts`](./src/inspect.ts) — prints the references Temporal Server actually holds
  alongside the blobs on disk they point at.

## Running this sample

1. `temporal server start-dev` to start [Temporal Server](https://github.com/temporalio/cli/#installation).
1. `npm install` to install dependencies.
1. `npm run start.watch` to start the Worker.
1. In another shell, `npm run workflow` to run the Workflow Client.
1. `npm run inspect <workflowId>` to see what was stored where.

The Client passes a 1 MiB document and gets ~1 MiB of extracted text back. Inline, that
same payload would cross the wire five times, each crossing over the SDK's default 512 KiB
outbound size warning and pushing toward the server's 2 MiB per-payload limit:

```
Starting workflow with a 1048590 byte document
Payloads of 32768 bytes or more are offloaded to .../external-storage/storage
Started workflow document-V1StGXR8_Z5jdHi6B
Summary: 17404 lines, 165338 words, 1048590 characters
Received 1048590 bytes of extracted text

To see what the server actually stored, run:
  npm run inspect document-V1StGXR8_Z5jdHi6B
```

`npm run inspect` then shows the same execution from the server's side. Every large
payload is a reference of a few hundred bytes; the small one was left inline (keys
abbreviated here):

```
History payloads for document-V1StGXR8_Z5jdHi6B:

  #1 WORKFLOW_EXECUTION_STARTED: 300 bytes on the wire (reference to 1066065 bytes in 'sample.filesystemdriver', key=v1/wf/default/processDocument/document-.../null/sha256/1558f39e...)
  #5 ACTIVITY_TASK_SCHEDULED: 332 bytes on the wire (reference to 1066065 bytes in 'sample.filesystemdriver', key=v1/wf/.../d0dd96bc-.../sha256/1558f39e...)
  #7 ACTIVITY_TASK_COMPLETED: 332 bytes on the wire (reference to 1066023 bytes in 'sample.filesystemdriver', key=v1/wf/.../d0dd96bc-.../sha256/dfb0fab1...)
  #11 ACTIVITY_TASK_SCHEDULED: 332 bytes on the wire (reference to 1066023 bytes in 'sample.filesystemdriver', key=v1/wf/.../d0dd96bc-.../sha256/dfb0fab1...)
  #13 ACTIVITY_TASK_COMPLETED: 47 bytes on the wire (inline)
  #17 WORKFLOW_EXECUTION_COMPLETED: 332 bytes on the wire (reference to 1066137 bytes in 'sample.filesystemdriver', key=v1/wf/.../d0dd96bc-.../sha256/0a4efcbf...)
```

Four things this output shows:

- **The Client and the Worker are separate processes.** The blob behind event #1 was
  written by the Client and read by the Worker. Nothing coordinates them beyond both
  drivers resolving the same directory.
- **The threshold is per payload, not per Activity.** `summarize` returned 47 bytes at
  #13, under the 32 KiB threshold, so it stayed inline. Its 1 MiB _argument_ at #11 did
  not.
- **Identical content deduplicates.** #7 and #11 are the same key: the extracted text was
  stored once when the Activity completed, and the reference was reused when it became the
  next Activity's argument.
- **Deduplication stops at the key prefix.** #1 and #5 have the same hash under different
  prefixes, so the document is on disk twice. The Client stored it before a run ID
  existed, hence the `null` segment; the Worker stored it again under the real run ID.
  Four blobs, ~4 MiB, for one 1 MiB document. `buildKeyPrefix` in the driver explains the
  tradeoff and how to trade it the other way.

## Testing

`npm test` runs both suites:

- [`filesystem-storage-driver.test.ts`](./src/test/filesystem-storage-driver.test.ts) —
  the driver on its own: byte-for-byte round trips, deduplication, a second driver
  instance reading what the first wrote, and the failure paths (corrupted blob, hostile
  Workflow ID, claim pointing outside the storage root, oversized payload).
- [`workflows.test.ts`](./src/test/workflows.test.ts) — the Workflow against a test
  server, asserting the large payloads are references in History and that below-threshold
  payloads are not offloaded at all.

## Before using this in production

- **Prefer a vended driver.** The SDK ships
  [`@temporalio/external-storage-s3`](https://github.com/temporalio/sdk-typescript/tree/main/contrib/external-storage-s3)
  and
  [`@temporalio/external-storage-gcs`](https://github.com/temporalio/sdk-typescript/tree/main/contrib/external-storage-gcs).
  Write your own only if neither backend fits. This driver exists to show what the
  interface asks of you.
- **Shared storage is required.** A local directory only works here because everything
  runs on one machine. Real Workers need storage all of them can reach.
- **Nothing deletes blobs.** Retention is on you: an object-store lifecycle policy, or a
  reaper keyed on Workflow completion. Blobs must outlive every History that references
  them, including retention on completed Executions, replay, and Workflow Reset.
- **Payloads leave Temporal's trust boundary.** Whatever you offload is now protected by
  your storage's access control and encryption at rest, not Temporal's. Combine with a
  `PayloadCodec` if you need the bytes encrypted before they land there (see the
  [encryption](../encryption) sample).
- **The Web UI shows references, not values.** Offloaded payloads render as
  `ExternalStorageReference` in History. A [Codec Server](https://docs.temporal.io/production-deployment/data-encryption)
  can resolve them for viewing.
