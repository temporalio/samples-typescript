import assert from 'assert';
import { mkdtemp, readdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { after, before, describe, it } from 'mocha';
import { nanoid } from 'nanoid';
import { Client } from '@temporalio/client';
import { TestWorkflowEnvironment } from '@temporalio/testing';
import { DefaultLogger, Runtime, Worker } from '@temporalio/worker';
import * as activities from '../activities';
import { PAYLOAD_SIZE_THRESHOLD, createDataConverter } from '../data-converter';
import { makeDocument } from '../shared';
import { processDocument } from '../workflows';

const REFERENCE_MESSAGE_TYPE = 'temporal.api.sdk.v1.ExternalStorageReference';

describe('processDocument with external storage', function () {
  let env: TestWorkflowEnvironment;
  let storageRoot: string;

  this.slow(10_000);
  this.timeout(60_000);

  before(async function () {
    Runtime.install({ logger: new DefaultLogger('WARN') });
    env = await TestWorkflowEnvironment.createTimeSkipping();
    storageRoot = await mkdtemp(path.join(tmpdir(), 'external-storage-e2e-'));
  });

  after(async () => {
    await env?.teardown();
  });

  /**
   * Runs the Workflow with external storage configured on both the Client and the
   * Worker, as a deployment would. Returns the Workflow ID so a test can go back and
   * look at what the server actually recorded.
   */
  async function runWorkflow(documentSizeBytes: number): Promise<{ workflowId: string; extractedLength: number }> {
    const taskQueue = `test-${nanoid()}`;
    const workflowId = `test-${nanoid()}`;
    const dataConverter = createDataConverter(storageRoot);

    const worker = await Worker.create({
      connection: env.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities,
      dataConverter,
    });
    const client = new Client({ connection: env.connection, dataConverter });

    const result = await worker.runUntil(
      client.workflow.execute(processDocument, {
        args: [makeDocument('report.txt', documentSizeBytes)],
        taskQueue,
        workflowId,
      }),
    );

    return { workflowId, extractedLength: result.extractedText.length };
  }

  it('round-trips a document larger than the threshold', async () => {
    const documentSizeBytes = PAYLOAD_SIZE_THRESHOLD * 8;
    const { extractedLength } = await runWorkflow(documentSizeBytes);

    // Workflow and Activity code see the whole document; the offloading is invisible to
    // them.
    assert.ok(
      extractedLength >= documentSizeBytes,
      `expected at least ${documentSizeBytes} characters of extracted text, got ${extractedLength}`,
    );
    assert.ok((await listBlobs(storageRoot)).length > 0, 'expected blobs to be written to external storage');
  });

  it('keeps the large payloads out of Workflow History', async () => {
    const { workflowId } = await runWorkflow(PAYLOAD_SIZE_THRESHOLD * 8);

    // A Client *without* external storage sees what the server holds: references.
    // A Client *with* it configured, as in the test above, gets the real values back.
    const { events } = await env.client.workflow.getHandle(workflowId).fetchHistory();

    const startInput = events?.find((event) => event.workflowExecutionStartedEventAttributes)
      ?.workflowExecutionStartedEventAttributes?.input?.payloads?.[0];
    assert.ok(startInput, 'expected a start input payload');
    assert.strictEqual(readMetadata(startInput.metadata, 'messageType'), REFERENCE_MESSAGE_TYPE);
    assert.ok(
      (startInput.data?.length ?? 0) < PAYLOAD_SIZE_THRESHOLD,
      'the reference that replaced the document should be small',
    );

    const activityInput = events?.find((event) => event.activityTaskScheduledEventAttributes)
      ?.activityTaskScheduledEventAttributes?.input?.payloads?.[0];
    assert.ok(activityInput, 'expected an activity input payload');
    assert.strictEqual(readMetadata(activityInput.metadata, 'messageType'), REFERENCE_MESSAGE_TYPE);
  });

  it('leaves payloads below the threshold inline', async () => {
    const emptyRoot = await mkdtemp(path.join(tmpdir(), 'external-storage-inline-'));
    const taskQueue = `test-${nanoid()}`;
    const dataConverter = createDataConverter(emptyRoot);

    const worker = await Worker.create({
      connection: env.nativeConnection,
      taskQueue,
      workflowsPath: require.resolve('../workflows'),
      activities,
      dataConverter,
    });
    const client = new Client({ connection: env.connection, dataConverter });

    await worker.runUntil(
      client.workflow.execute(processDocument, {
        args: [makeDocument('memo.txt', 256)],
        taskQueue,
        workflowId: `test-${nanoid()}`,
      }),
    );

    assert.deepStrictEqual(await listBlobs(emptyRoot), [], 'nothing should be offloaded below the threshold');
  });
});

function readMetadata(metadata: Record<string, Uint8Array> | null | undefined, key: string): string | undefined {
  const raw = metadata?.[key];
  return raw ? Buffer.from(raw).toString() : undefined;
}

async function listBlobs(rootDir: string): Promise<string[]> {
  const blobs: string[] = [];
  for (const entry of await readdir(rootDir, { recursive: true })) {
    if ((await stat(path.join(rootDir, entry))).isFile()) blobs.push(entry);
  }
  return blobs;
}
