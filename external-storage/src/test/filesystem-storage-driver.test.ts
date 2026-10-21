import assert from 'assert';
import { mkdtemp, readdir, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { before, describe, it } from 'mocha';
import { StorageDriverClaim } from '@temporalio/common';
import type { Payload, StorageDriverTargetInfo } from '@temporalio/common';
import { defaultPayloadConverter } from '@temporalio/common';
import { FileSystemStorageDriver } from '../filesystem-storage-driver';

const workflowTarget: StorageDriverTargetInfo = {
  kind: 'workflow',
  namespace: 'default',
  id: 'doc-1',
  runId: 'run-1',
  type: 'processDocument',
};

function toPayload(value: unknown): Payload {
  return defaultPayloadConverter.toPayload(value)!;
}

function toBytes(data: Uint8Array | null | undefined): Buffer {
  return Buffer.from(data ?? new Uint8Array());
}

function readEncoding(payload: Payload): string {
  return Buffer.from(payload.metadata?.encoding ?? new Uint8Array()).toString();
}

async function listFiles(rootDir: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(rootDir, { recursive: true })) {
    const filePath = path.join(rootDir, entry);
    if ((await stat(filePath)).isFile()) files.push(filePath);
  }
  return files;
}

describe('FileSystemStorageDriver', function () {
  let rootDir: string;
  let driver: FileSystemStorageDriver;

  before(async () => {
    rootDir = await mkdtemp(path.join(tmpdir(), 'external-storage-test-'));
    driver = new FileSystemStorageDriver({ rootDir });
  });

  it('round-trips a payload byte-for-byte', async () => {
    const original = toPayload({ text: 'x'.repeat(100_000), nested: { flag: true } });

    const [claim] = await driver.store({ target: workflowTarget }, [original]);
    const [retrieved] = await driver.retrieve({}, [claim]);

    // Compare bytes rather than the objects: protobuf decoding yields `Buffer` where the
    // PayloadConverter produced `Uint8Array`. Buffer extends Uint8Array, so the SDK
    // treats them alike, but `deepStrictEqual` compares prototypes and would fail.
    assert.strictEqual(Buffer.compare(toBytes(retrieved.data), toBytes(original.data)), 0, 'payload data should match');
    assert.deepStrictEqual(Object.keys(retrieved.metadata ?? {}), Object.keys(original.metadata ?? {}));
    assert.strictEqual(readEncoding(retrieved), readEncoding(original), 'metadata should survive the round trip');
    assert.deepStrictEqual(
      defaultPayloadConverter.fromPayload(retrieved),
      defaultPayloadConverter.fromPayload(original),
    );
  });

  it('returns one claim per payload, in order', async () => {
    const payloads = [toPayload('first'), toPayload('second'), toPayload('third')];

    const claims = await driver.store({ target: workflowTarget }, payloads);
    const retrieved = await driver.retrieve({}, claims);

    assert.strictEqual(claims.length, payloads.length);
    assert.deepStrictEqual(
      retrieved.map((payload) => defaultPayloadConverter.fromPayload(payload)),
      ['first', 'second', 'third'],
    );
  });

  it('writes identical payloads once', async () => {
    const localRoot = await mkdtemp(path.join(tmpdir(), 'external-storage-dedupe-'));
    const localDriver = new FileSystemStorageDriver({ rootDir: localRoot });
    const payload = toPayload('the same bytes twice');

    const [first] = await localDriver.store({ target: workflowTarget }, [payload]);
    const [second] = await localDriver.store({ target: workflowTarget }, [payload]);

    assert.deepStrictEqual(first.claimData, second.claimData, 'identical content should produce identical claims');
    assert.strictEqual((await listFiles(localRoot)).length, 1);
  });

  it('keys blobs under the storing workflow', async () => {
    const localRoot = await mkdtemp(path.join(tmpdir(), 'external-storage-key-'));
    const localDriver = new FileSystemStorageDriver({ rootDir: localRoot });

    const [claim] = await localDriver.store({ target: workflowTarget }, [toPayload('keyed')]);

    assert.match(claim.claimData.key, /^v1\/wf\/default\/processDocument\/doc-1\/run-1\/sha256\/[0-9a-f]{64}$/);
  });

  // Workflow IDs are caller-supplied and become part of the key, so they must not be
  // able to steer a write out of the blob store.
  for (const hostileWorkflowId of ['../../escape attempt', '..', '.', 'a/b']) {
    it(`neutralizes a workflow ID of '${hostileWorkflowId}'`, async () => {
      const localRoot = await mkdtemp(path.join(tmpdir(), 'external-storage-escape-'));
      const localDriver = new FileSystemStorageDriver({ rootDir: localRoot });

      const [claim] = await localDriver.store({ target: { ...workflowTarget, id: hostileWorkflowId } }, [
        toPayload('escaped'),
      ]);

      const components = claim.claimData.key.split('/');
      assert.ok(!components.includes('..') && !components.includes('.'), `traversal in key: ${claim.claimData.key}`);

      const [file] = await listFiles(localRoot);
      assert.ok(file?.startsWith(localRoot + path.sep), `blob written outside rootDir: ${file}`);

      // And it still reads back, which is the part a hostile ID must not break.
      const [retrieved] = await localDriver.retrieve({}, [claim]);
      assert.strictEqual(defaultPayloadConverter.fromPayload(retrieved), 'escaped');
    });
  }

  it('a second driver instance reads what the first one wrote', async () => {
    // The point of external storage: the process that stores a payload is usually not
    // the process that reads it back.
    const [claim] = await driver.store({ target: workflowTarget }, [toPayload('written by another process')]);

    const otherWorkerDriver = new FileSystemStorageDriver({ rootDir });
    const [retrieved] = await otherWorkerDriver.retrieve({}, [claim]);

    assert.strictEqual(defaultPayloadConverter.fromPayload(retrieved), 'written by another process');
  });

  it('rejects a corrupted blob', async () => {
    const [claim] = await driver.store({ target: workflowTarget }, [toPayload('will be corrupted')]);
    await writeFile(path.join(rootDir, claim.claimData.key), 'not the promised bytes');

    await assert.rejects(driver.retrieve({}, [claim]), /integrity check failed/);
  });

  it('rejects a claim whose key escapes rootDir', async () => {
    const claim = new StorageDriverClaim({
      key: '../../../etc/passwd',
      hashAlgorithm: 'sha256',
      hashValue: 'f'.repeat(64),
    });

    await assert.rejects(driver.retrieve({}, [claim]), /resolves outside rootDir/);
  });

  it('rejects a claim without integrity information', async () => {
    const claim = new StorageDriverClaim({ key: 'v1/sha256/deadbeef' });

    await assert.rejects(driver.retrieve({}, [claim]), /hashAlgorithm/);
  });

  it('refuses a payload larger than maxPayloadSize', async () => {
    const smallLimitDriver = new FileSystemStorageDriver({ rootDir, maxPayloadSize: 1024 });

    await assert.rejects(
      smallLimitDriver.store({ target: workflowTarget }, [toPayload('x'.repeat(2048))]),
      /exceeds the configured maxPayloadSize/,
    );
  });
});
