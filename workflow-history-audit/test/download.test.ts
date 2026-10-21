import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { Client, type ConnectionLike } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { historyToJSON } from '@temporalio/common/lib/proto-utils.js';
import proto from '@temporalio/proto';
import { parseDownloadOptions } from '../src/commands/cli.js';
import { noopDataConverter, noopPayloadCodec } from '../src/internal/noop-data-converter.js';

const { temporal } = proto;

void test('parses and normalizes download options', () => {
  const connectionOptions = loadClientConnectConfig().connectionOptions;
  assert.deepEqual(
    parseDownloadOptions([
      '--filter-time-start',
      '2024-01-02T11:00-05:00',
      '--filter-time-end',
      '2024-01-02T21:00Z',
      '--task-queue',
      'example-queue',
      '--out',
      './audit-data',
      '--namespace',
      'payments',
    ]),
    {
      visibilityQuery:
        'TaskQueue = "example-queue" AND StartTime <= "2024-01-02T21:00:00.000Z" AND CloseTime >= "2024-01-02T16:00:00.000Z"',
      historiesDirectory: './audit-data',
      connectionOptions,
      namespace: 'payments',
      requestsPerSecond: 40,
      concurrency: 10,
    },
  );
});

void test('validates related download options', () => {
  const required = [
    '--filter-time-start',
    '2024-01-02T11:00:00Z',
    '--filter-time-end',
    '2024-01-02T21:00:00Z',
    '--task-queue',
    'example-queue',
    '--out',
    './audit-data',
  ];

  assertDownloadOptionsError([...required, '--concurrency', '0'], /--concurrency must be a positive integer/);
  assertDownloadOptionsError(
    [...required, '--filter-time-start', '2024-01-03T00:00:00Z', '--filter-time-end', '2024-01-02T00:00:00Z'],
    /--filter-time-start must be no later than --filter-time-end/,
  );
  assertDownloadOptionsError(
    [...required, '--filter-time-by', 'invalid'],
    /--filter-time-by must be start, end, or overlap/,
  );
});

void test('builds Visibility queries for each time filter mode', () => {
  const args = [
    '--filter-time-start',
    '2024-01-02T11:00:00Z',
    '--filter-time-end',
    '2024-01-02T21:00:00Z',
    '--task-queue',
    'example-queue',
    '--out',
    './audit-data',
  ];

  assert.equal(
    parseDownloadOptions([...args, '--filter-time-by', 'start'])?.visibilityQuery,
    'TaskQueue = "example-queue" AND StartTime >= "2024-01-02T11:00:00.000Z" AND StartTime <= "2024-01-02T21:00:00.000Z" AND CloseTime IS NOT NULL',
  );
  assert.equal(
    parseDownloadOptions([...args, '--filter-time-by', 'end'])?.visibilityQuery,
    'TaskQueue = "example-queue" AND CloseTime >= "2024-01-02T11:00:00.000Z" AND CloseTime <= "2024-01-02T21:00:00.000Z"',
  );
  assert.equal(
    parseDownloadOptions([...args, '--filter-time-by', 'overlap'])?.visibilityQuery,
    'TaskQueue = "example-queue" AND StartTime <= "2024-01-02T21:00:00.000Z" AND CloseTime >= "2024-01-02T11:00:00.000Z"',
  );
  assert.equal(
    parseDownloadOptions([
      '--filter-time-start',
      '2024-01-02T11:00:00Z',
      '--filter-time-end',
      '2024-01-02T21:00:00Z',
      '--out',
      './audit-data',
    ])?.visibilityQuery,
    'StartTime <= "2024-01-02T21:00:00.000Z" AND CloseTime >= "2024-01-02T11:00:00.000Z"',
  );
});

void test('provides help without requiring other arguments', () => {
  const cwd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/commands/download.ts', '--help'], {
    cwd,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout + result.stderr, /^Usage: npm run download/);
});

void test('SDK history serializer produces the expected event JSON', () => {
  const raw = {
    events: [
      {
        eventId: 1,
        eventType: 1,
        eventTime: { seconds: 1, nanos: 0 },
        workflowExecutionStartedEventAttributes: {},
      },
    ],
  };
  const history = JSON.parse(historyToJSON(raw as unknown as Parameters<typeof historyToJSON>[0]));
  assert.equal(history.events[0].eventId, '1');
  assert.equal(history.events[0].eventType, 'EVENT_TYPE_WORKFLOW_EXECUTION_STARTED');
  assert.equal(history.events[0].eventTime, '1970-01-01T00:00:01Z');
});

void test('history serialization preserves codec-encoded payload bytes', () => {
  const encoded = Buffer.from('ciphertext-only');
  const raw = {
    events: [
      {
        eventId: 1,
        eventType: 1,
        eventTime: { seconds: 1, nanos: 0 },
        workflowExecutionStartedEventAttributes: {
          input: { payloads: [{ metadata: { encoding: Buffer.from('binary/encrypted') }, data: encoded }] },
        },
      },
    ],
  };
  const history = JSON.parse(historyToJSON(raw as unknown as Parameters<typeof historyToJSON>[0]));
  const payload = history.events[0].workflowExecutionStartedEventAttributes.input.payloads[0];
  assert.equal(payload.data, encoded.toString('base64'));
  assert.equal(payload.metadata.encoding, Buffer.from('binary/encrypted').toString('base64'));
  assert.ok(!JSON.stringify(history).includes('ciphertext-only'));
});

void test('downloader client leaves encoded Visibility memo payloads untouched', async () => {
  const encodedPayload = {
    metadata: { encoding: Buffer.from('binary/encrypted'), encryptionKeyId: Buffer.from('key-1') },
    data: Buffer.from('ciphertext-only'),
  };
  const raw = temporal.api.workflow.v1.WorkflowExecutionInfo.fromObject({
    execution: { workflowId: 'workflow-1', runId: 'run-1' },
    type: { name: 'workflow' },
    taskQueue: 'example-queue',
    status: 1,
    historyLength: 1,
    startTime: { seconds: 1, nanos: 0 },
    memo: { fields: { secret: encodedPayload } },
  });
  const connection = {
    plugins: [],
    workflowService: {
      async listWorkflowExecutions() {
        return { executions: [raw], nextPageToken: Buffer.alloc(0) };
      },
    },
  } as unknown as ConnectionLike;
  const client = new Client({ connection, namespace: 'test', dataConverter: noopDataConverter });
  const infos = [];
  for await (const info of client.workflow.list({ query: 'TaskQueue = "example-queue"' })) infos.push(info);
  assert.equal(infos.length, 1);
  const memoPayload = infos[0]!.memo?.secret;
  assert.ok(memoPayload);
  assert.strictEqual(memoPayload, raw.memo?.fields?.secret);
  assert.deepEqual(memoPayload.data, encodedPayload.data);
  assert.deepEqual(memoPayload.metadata, encodedPayload.metadata);
  const payloads = [encodedPayload];
  assert.strictEqual(await noopPayloadCodec.encode(payloads), payloads);
  assert.strictEqual(await noopPayloadCodec.decode(payloads), payloads);
});

function assertDownloadOptionsError(args: string[], expected: RegExp): void {
  const originalConsoleError = console.error;
  const originalExitCode = process.exitCode;
  const errors: string[] = [];
  console.error = (...values: unknown[]) => errors.push(values.map(String).join(' '));
  process.exitCode = undefined;
  try {
    assert.equal(parseDownloadOptions(args), undefined);
    assert.match(errors.join('\n'), expected);
    assert.equal(process.exitCode, 1);
  } finally {
    console.error = originalConsoleError;
    process.exitCode = originalExitCode;
  }
}
