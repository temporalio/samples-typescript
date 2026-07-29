import { readdir, stat } from 'node:fs/promises';
import * as path from 'node:path';
import { Client, Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { temporal } from '@temporalio/proto';
import { STORAGE_ROOT } from './data-converter';

/** Metadata written by the SDK on the reference payload that replaces an offloaded one. */
const REFERENCE_ENCODING = 'json/protobuf';
const REFERENCE_MESSAGE_TYPE = 'temporal.api.sdk.v1.ExternalStorageReference';

/**
 * Shows both halves of the round trip for one Workflow Execution: the small references
 * Temporal Server holds, and the blobs on disk they point at.
 *
 * Usage: `npm run inspect <workflowId>`
 */
async function run() {
  const workflowId = process.argv[2];
  if (!workflowId) {
    console.error('Usage: npm run inspect <workflowId>');
    process.exit(1);
  }

  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);

  // Deliberately *without* external storage. A Client configured with it retrieves
  // references transparently, which is exactly what we want to look behind here.
  const client = new Client({ connection });

  const { events } = await client.workflow.getHandle(workflowId).fetchHistory();

  console.log(`History payloads for ${workflowId}:\n`);
  for (const event of events ?? []) {
    const eventType = (temporal.api.enums.v1.EventType[event.eventType ?? 0] ?? 'UNKNOWN').replace('EVENT_TYPE_', '');
    for (const payload of collectPayloads(event)) {
      const wireSize = payload.data?.length ?? 0;
      const reference = describeReference(payload);
      const detail = reference ?? 'inline';
      console.log(`  #${event.eventId} ${eventType}: ${wireSize} bytes on the wire (${detail})`);
    }
  }

  const blobs = await listBlobs(STORAGE_ROOT);
  console.log(`\nBlobs under ${STORAGE_ROOT}:\n`);
  if (blobs.length === 0) {
    console.log('  (none: no payload has crossed the size threshold yet)');
  }
  let total = 0;
  for (const blob of blobs) {
    total += blob.size;
    console.log(`  ${blob.size} bytes  ${blob.relativePath}`);
  }
  console.log(`\n${blobs.length} blob(s), ${total} bytes total`);

  await connection.close();
}

/**
 * Finds every Payload nested anywhere in a history event.
 *
 * Payloads hang off dozens of differently shaped event attributes (`input`, `result`,
 * `details`, `lastHeartbeatDetails`, memo fields, ...), so this walks the decoded event
 * instead of enumerating them. Fine for an inspection script; application code should
 * reach for the specific field it cares about.
 */
function collectPayloads(
  node: unknown,
  found: temporal.api.common.v1.IPayload[] = [],
): temporal.api.common.v1.IPayload[] {
  if (node === null || typeof node !== 'object' || node instanceof Uint8Array) return found;
  if (isPayload(node)) {
    found.push(node);
    return found;
  }
  for (const value of Object.values(node)) {
    collectPayloads(value, found);
  }
  return found;
}

function isPayload(node: object): node is temporal.api.common.v1.IPayload {
  const candidate = node as { metadata?: unknown; data?: unknown };
  return candidate.data instanceof Uint8Array && typeof candidate.metadata === 'object' && candidate.metadata !== null;
}

/** Describes a payload if it is an external storage reference, else `null`. */
function describeReference(payload: temporal.api.common.v1.IPayload): string | null {
  if (
    readMetadata(payload, 'encoding') !== REFERENCE_ENCODING ||
    readMetadata(payload, 'messageType') !== REFERENCE_MESSAGE_TYPE
  ) {
    return null;
  }

  // The reference is a protobuf-JSON encoded ExternalStorageReference: the driver name
  // plus the claim that driver handed back. The original size travels alongside it in
  // `externalPayloads`, so tooling can report the real payload size without a fetch.
  const { driverName, claimData } = JSON.parse(Buffer.from(payload.data ?? []).toString()) as {
    driverName?: string;
    claimData?: Record<string, string>;
  };
  const originalSize = payload.externalPayloads?.[0]?.sizeBytes;
  return `reference to ${originalSize ?? '?'} bytes in '${driverName}', key=${claimData?.key}`;
}

function readMetadata(payload: temporal.api.common.v1.IPayload, key: string): string | undefined {
  const raw = payload.metadata?.[key];
  return raw ? Buffer.from(raw).toString() : undefined;
}

async function listBlobs(rootDir: string): Promise<{ relativePath: string; size: number }[]> {
  let entries: string[];
  try {
    entries = await readdir(rootDir, { recursive: true });
  } catch {
    return [];
  }

  const blobs = [];
  for (const entry of entries) {
    const stats = await stat(path.join(rootDir, entry));
    if (stats.isFile()) {
      blobs.push({ relativePath: entry, size: stats.size });
    }
  }
  return blobs.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
