import { createHash, randomUUID } from 'node:crypto';
import { access, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { StorageDriverClaim } from '@temporalio/common';
import type {
  Payload,
  StorageDriver,
  StorageDriverRetrieveContext,
  StorageDriverStoreContext,
  StorageDriverTargetInfo,
} from '@temporalio/common';
import { temporal } from '@temporalio/proto';

const PayloadProto = temporal.api.common.v1.Payload;

/**
 * Prefix on every key. Keys are stored verbatim in the claim, so old claims keep
 * resolving after you change the layout below: bump this and new blobs land under
 * the new scheme while existing references still point at the old one.
 */
const KEY_LAYOUT_VERSION = 'v1';

/** Guardrail against a single runaway payload filling the disk. */
const DEFAULT_MAX_PAYLOAD_SIZE = 50 * 1024 * 1024;

const HASH_ALGORITHM = 'sha256';

/** Key segment written when a target field is absent (e.g. a run ID we don't know yet). */
const NULL_SEGMENT = 'null';

/** Characters allowed in a path segment. Everything else is escaped. */
const UNSAFE_SEGMENT_CHARS = /[^A-Za-z0-9._-]/g;

/** Cap on a single path segment, to stay well inside filesystem limits (255 bytes on ext4/APFS). */
const MAX_SEGMENT_LENGTH = 120;

export interface FileSystemStorageDriverOptions {
  /**
   * Directory that holds the blobs. Every process that needs to read a payload back
   * must be able to reach this same directory, so in a real deployment this is a
   * shared mount (NFS, EFS, a Kubernetes RWX volume), not a local temp dir.
   */
  rootDir: string;

  /**
   * Routing name written into the reference payload on the wire. The retrieving side
   * looks the driver up by this name, so it must match across every Client and Worker
   * that touches the workflow, and it must stay stable for as long as any history
   * still references blobs written by this driver.
   */
  driverName?: string;

  /** Maximum serialized size of a single payload, in bytes. Defaults to 50 MiB. */
  maxPayloadSize?: number;
}

/**
 * A custom {@link StorageDriver} that offloads large payloads to a filesystem
 * directory instead of sending them to Temporal Server.
 *
 * The SDK calls {@link store} on the way out and replaces each stored payload with a
 * small reference containing this driver's `name` and the returned claim. On the way
 * in, it reads the reference, finds the driver by name, and calls {@link retrieve}.
 * Workflow and Activity code never sees any of this: it gets the original value.
 *
 * Blobs are content-addressed by a SHA-256 hash of the serialized payload:
 *
 * - Writing the same bytes twice is a no-op, which matters because Temporal retries.
 *   An Activity that heartbeats the same large details repeatedly, or a Workflow Task
 *   that replays after a failure, does not accumulate duplicate blobs.
 * - The hash doubles as an integrity check on read (see {@link retrieve}).
 *
 * The alternative, keying by a random UUID, makes cleanup easier to reason about
 * (one blob has exactly one referrer) at the cost of both properties above.
 *
 * Note on process boundaries: an in-memory `Map` driver is tempting and about ten
 * lines, but it only works while the storing and retrieving code share a process.
 * The moment a second Worker picks up the Activity Task, or the Client tries to read
 * a Workflow result, retrieval fails. That cross-process handoff is the whole point of
 * external storage, so this driver uses the filesystem.
 */
export class FileSystemStorageDriver implements StorageDriver {
  readonly name: string;

  /**
   * Stable identifier for this *implementation*, shared by every instance and reported
   * to the server via Worker heartbeat for observability. Distinct from `name`, which
   * identifies this particular configured instance. The SDK's own drivers use values
   * like `aws.s3driver` and `gcp.gcsdriver`.
   */
  readonly type = 'sample.filesystemdriver';

  private readonly rootDir: string;
  private readonly maxPayloadSize: number;

  constructor({ rootDir, driverName = 'sample.filesystemdriver', maxPayloadSize }: FileSystemStorageDriverOptions) {
    this.rootDir = path.resolve(rootDir);
    this.name = driverName;
    this.maxPayloadSize = maxPayloadSize ?? DEFAULT_MAX_PAYLOAD_SIZE;
  }

  /**
   * Called with every payload the SDK decided to offload, batched per driver. Must
   * return one claim per payload, in the same order.
   *
   * Throwing here fails the enclosing Workflow or Activity Task *retryably*, so a
   * transient I/O error is retried rather than killing the Execution. That makes it
   * safe to let errors propagate instead of, say, silently falling back to inline
   * payloads, which would defeat the point of the size threshold.
   */
  async store(context: StorageDriverStoreContext, payloads: Payload[]): Promise<StorageDriverClaim[]> {
    const keyPrefix = buildKeyPrefix(context.target);
    return runAllAbortingOnFirstError(context.abortSignal, (signal) =>
      payloads.map((payload) => this.storePayload(payload, keyPrefix, signal)),
    );
  }

  /** Inverse of {@link store}: one payload per claim, in the same order. */
  async retrieve(context: StorageDriverRetrieveContext, claims: StorageDriverClaim[]): Promise<Payload[]> {
    return runAllAbortingOnFirstError(context.abortSignal, (signal) =>
      claims.map((claim) => this.retrievePayload(claim, signal)),
    );
  }

  private async storePayload(
    payload: Payload,
    keyPrefix: string,
    abortSignal: AbortSignal,
  ): Promise<StorageDriverClaim> {
    // Store the encoded Payload proto, not just `payload.data`. A Payload also carries
    // metadata (the `encoding` key, protobuf message names, anything a custom
    // PayloadConverter added), and metadata values are arbitrary bytes that would not
    // survive a round trip through the string-valued claim map. Encoding the whole
    // message keeps the payload byte-for-byte identical end to end.
    const payloadBytes = PayloadProto.encode(payload).finish();
    if (payloadBytes.length > this.maxPayloadSize) {
      throw new Error(
        `Payload of ${payloadBytes.length} bytes exceeds the configured maxPayloadSize of ${this.maxPayloadSize} bytes`,
      );
    }

    const hashValue = createHash(HASH_ALGORITHM).update(payloadBytes).digest('hex');
    const key = `${keyPrefix}/${HASH_ALGORITHM}/${hashValue}`;

    try {
      await this.writeIfAbsent(key, payloadBytes, abortSignal);
    } catch (err) {
      // Wrapping adds the context that makes a retry loop diagnosable: a bare ENOENT
      // says nothing about which key or which storage root. On ES2022 and above, prefer
      // `new Error(message, { cause: err })` to keep the original stack attached; these
      // samples target ES2021, so the message is folded in instead.
      throw new Error(
        `FileSystemStorageDriver failed to store [rootDir=${this.rootDir}, key=${key}]: ${describe(err)}`,
      );
    }

    // The claim is the only thing that reaches Temporal Server, embedded in the
    // reference payload that replaces the real one. Keep it small and keep it free of
    // anything sensitive: it is visible in Workflow History and in the Web UI.
    //
    // `rootDir` is deliberately absent. It is deployment configuration, and a second
    // Worker may well mount the same storage at a different path; putting it in the
    // claim would pin every historical reference to one machine's filesystem layout.
    return new StorageDriverClaim({ key, hashAlgorithm: HASH_ALGORITHM, hashValue });
  }

  /**
   * Writes the blob unless it is already there. The write goes to a temporary file and
   * is then renamed, because `rename` is atomic: a reader can only ever observe the
   * complete blob, never a half-written one. Without that, a crash mid-write would
   * leave a file whose name promises content it does not contain, and content
   * addressing would hand it to a reader as valid.
   */
  private async writeIfAbsent(key: string, payloadBytes: Uint8Array, abortSignal: AbortSignal): Promise<void> {
    const filePath = this.resolveKey(key);
    if (await exists(filePath)) return;

    await mkdir(path.dirname(filePath), { recursive: true });
    const tempPath = `${filePath}.${randomUUID()}.tmp`;
    try {
      await writeFile(tempPath, payloadBytes, { signal: abortSignal });
      await rename(tempPath, filePath);
    } catch (err) {
      await unlink(tempPath).catch(() => undefined);
      // Two Workers can race to store identical bytes. On POSIX the loser's rename
      // silently replaces an identical file; on Windows it fails. Either way the blob
      // is present and correct, so treat that as success.
      if (await exists(filePath)) return;
      throw err;
    }
  }

  private async retrievePayload(claim: StorageDriverClaim, abortSignal: AbortSignal): Promise<Payload> {
    const { key, hashAlgorithm, hashValue: expectedHash } = claim.claimData;
    // Claims come off the wire, so validate rather than assume. A missing field means a
    // claim written by a different driver, or by an older version of this one.
    if (!key) {
      throw new Error("FileSystemStorageDriver claim is missing required field 'key'");
    }
    if (hashAlgorithm !== HASH_ALGORITHM || !expectedHash) {
      throw new Error(
        `FileSystemStorageDriver claim [key=${key}] must carry hashAlgorithm='${HASH_ALGORITHM}' and a hashValue, ` +
          `got hashAlgorithm='${hashAlgorithm ?? ''}'`,
      );
    }

    const filePath = this.resolveKey(key);
    let payloadBytes: Uint8Array;
    try {
      payloadBytes = await readFile(filePath, { signal: abortSignal });
    } catch (err) {
      throw new Error(
        `FileSystemStorageDriver failed to retrieve [rootDir=${this.rootDir}, key=${key}]: ${describe(err)}`,
      );
    }

    // Verifying is cheap next to the read and catches truncation, corruption, and a
    // claim pointing at the wrong blob. Failing loudly here is much better than
    // handing malformed bytes to the PayloadConverter, where the error would surface
    // as a confusing deserialization failure far from its cause.
    const actualHash = createHash(HASH_ALGORITHM).update(payloadBytes).digest('hex');
    if (actualHash !== expectedHash) {
      throw new Error(
        `FileSystemStorageDriver integrity check failed [key=${key}]: ` +
          `expected ${HASH_ALGORITHM}:${expectedHash}, got ${HASH_ALGORITHM}:${actualHash}`,
      );
    }

    return PayloadProto.decode(payloadBytes);
  }

  /**
   * Maps a key to a path under `rootDir`, refusing anything that escapes it. Keys
   * arrive from Workflow History, which we should not treat as trusted input: a claim
   * containing `../../etc/passwd` must not turn into a read outside the blob store.
   */
  private resolveKey(key: string): string {
    const filePath = path.resolve(this.rootDir, key);
    if (filePath !== this.rootDir && !filePath.startsWith(this.rootDir + path.sep)) {
      throw new Error(`FileSystemStorageDriver refused a key that resolves outside rootDir [key=${key}]`);
    }
    return filePath;
  }
}

/**
 * Builds the directory prefix for a blob from the Workflow or Activity that produced
 * it. Nothing functionally depends on this (the claim carries the full key), but it
 * makes the store browsable and gives cleanup something to work with: "delete blobs
 * for this run" becomes a directory removal.
 *
 * The tradeoff is that deduplication only reaches within a prefix, so identical bytes
 * stored under two different prefixes are written twice. This is visible in the sample:
 * a Client stores a Workflow argument before the run ID exists, so its blob lands under
 * a `null` run ID, and the Worker writes the same bytes again under the real run ID once
 * the Workflow schedules an Activity with them.
 *
 * Dropping the prefix for a flat `sha256/<hash>` namespace buys global deduplication and
 * gives up per-run locality, which is what cleanup keys off. The vended S3 and GCS
 * drivers make the same choice this one does; whether it is right for you depends on
 * whether your payloads repeat across Executions and how you plan to expire them.
 */
function buildKeyPrefix(target: StorageDriverTargetInfo | undefined): string {
  if (target === undefined) return KEY_LAYOUT_VERSION;
  const segments =
    target.kind === 'workflow'
      ? ['wf', target.namespace, target.type, target.id, target.runId]
      : ['act', target.namespace, target.type, target.id, target.runId];
  return [KEY_LAYOUT_VERSION, ...segments.map(toSafeSegment)].join('/');
}

/**
 * Escapes a value for use as a single path segment. Workflow IDs are caller-supplied
 * and may contain `/`, `..`, or characters the filesystem reserves, so allow a known
 * set and escape everything else rather than blocklisting known-bad input.
 */
function toSafeSegment(value: string | undefined): string {
  if (!value) return NULL_SEGMENT;
  let escaped = value.replace(UNSAFE_SEGMENT_CHARS, (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`);

  // `.` and `..` are made of allowed characters but mean something to the filesystem, so
  // they need escaping too: a Workflow ID of `..` would otherwise become a path
  // component that walks up a level. `resolveKey` would still refuse to read or write
  // outside `rootDir`, but the blob would land somewhere surprising on the way there.
  if (escaped === '.' || escaped === '..') escaped = escaped.replace(/\./g, '%2e');

  // Truncation can make two very long IDs share a prefix directory. Harmless, since the
  // blob's own name is its content hash, but worth knowing when browsing the store.
  return escaped.length <= MAX_SEGMENT_LENGTH ? escaped : escaped.slice(0, MAX_SEGMENT_LENGTH);
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Runs the per-payload operations concurrently and, on the first failure, aborts the
 * rest before propagating the error. The SDK hands us an `abortSignal` and expects
 * siblings to be cancelled on first error: once one payload in a batch fails, the
 * enclosing Task is going to fail anyway, so finishing the other writes is wasted work.
 */
async function runAllAbortingOnFirstError<T>(
  externalSignal: AbortSignal | undefined,
  makeTasks: (signal: AbortSignal) => Promise<T>[],
): Promise<T[]> {
  const controller = new AbortController();
  const signal = externalSignal ? AbortSignal.any([externalSignal, controller.signal]) : controller.signal;
  const tasks = makeTasks(signal);
  try {
    return await Promise.all(tasks);
  } catch (err) {
    controller.abort();
    // Wait for the aborted siblings to settle so no write is still in flight (and no
    // temp file un-cleaned) by the time the Task retries.
    await Promise.allSettled(tasks);
    throw err;
  }
}
