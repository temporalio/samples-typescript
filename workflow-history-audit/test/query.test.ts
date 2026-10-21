import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { defaultPayloadConverter } from '@temporalio/common';
import { payloadToJSON } from '@temporalio/common/lib/proto-utils.js';
import { parseQueryOptions } from '../src/commands/cli.js';
import { analysisPath, atomicWrite, historyPath, type HistoryEnvelope } from '../src/internal/history-storage.js';

function input(value: unknown): { payloads: unknown[] } {
  const payload = defaultPayloadConverter.toPayload(value);
  assert.ok(payload);
  return { payloads: [payloadToJSON(payload)] };
}

void test('parses query options', () => {
  assert.deepEqual(
    parseQueryOptions(['--analysis', './analysis', '--identity', 'worker-1', '--from', '2024-01-02T11:00:00Z']),
    {
      analysisDirectory: './analysis',
      identity: 'worker-1',
      buildId: undefined,
      from: '2024-01-02T11:00:00.000Z',
      to: undefined,
    },
  );
});

void test('validates query filters', () => {
  assert.throws(() => parseQueryOptions(['--analysis', './analysis']), /Specify --identity or --build-id/);
  assert.throws(
    () => parseQueryOptions(['--analysis', './analysis', '--identity', 'worker-1', '--property', 'groupId']),
    /Unknown option '--property'/,
  );
  assert.throws(
    () =>
      parseQueryOptions([
        '--analysis',
        './analysis',
        '--identity',
        'worker-1',
        '--from',
        '2024-01-03T00:00Z',
        '--to',
        '2024-01-02T00:00Z',
      ]),
    /--from must be no later than --to/,
  );
});

void test('provides help without requiring other arguments', () => {
  const cwd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/commands/query.ts', '--help'], {
    cwd,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout + result.stderr, /^Usage: npm run query/);
});

void test('finds a locally analyzed run by worker identity', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'workflow-history-audit-'));
  try {
    const envelope: HistoryEnvelope = {
      kind: 'workflow-history',
      formatVersion: 1,
      namespace: 'test',
      workflowId: 'id',
      runId: 'run',
      taskQueue: 'example-queue',
      history: {
        events: [
          {
            eventId: '1',
            eventType: 'EVENT_TYPE_WORKFLOW_EXECUTION_STARTED',
            eventTime: '2024-01-02T10:00:00Z',
            workflowExecutionStartedEventAttributes: { input: input({ groupId: 'A' }) },
          },
          {
            eventId: '2',
            eventType: 'EVENT_TYPE_WORKFLOW_TASK_COMPLETED',
            eventTime: '2024-01-02T12:00:00Z',
            workflowTaskCompletedEventAttributes: { identity: 'worker-1', workerVersion: { buildId: 'build-1' } },
          },
          {
            eventId: '3',
            eventType: 'EVENT_TYPE_WORKFLOW_TASK_STARTED',
            eventTime: '2024-01-02T12:00:01Z',
            workflowTaskStartedEventAttributes: { identity: 'worker-1', workerVersion: { buildId: 'build-1' } },
          },
          {
            eventId: '4',
            eventType: 'EVENT_TYPE_WORKFLOW_TASK_FAILED',
            eventTime: '2024-01-02T12:00:02Z',
            workflowTaskFailedEventAttributes: { startedEventId: '3', identity: 'history-service' },
          },
          {
            eventId: '5',
            eventType: 'EVENT_TYPE_WORKFLOW_TASK_STARTED',
            eventTime: '2024-01-02T12:00:03Z',
            workflowTaskStartedEventAttributes: { identity: 'worker-1', workerVersion: { buildId: 'build-1' } },
          },
          {
            eventId: '6',
            eventType: 'EVENT_TYPE_WORKFLOW_TASK_TIMED_OUT',
            eventTime: '2024-01-02T12:00:13Z',
            workflowTaskTimedOutEventAttributes: { startedEventId: '5', timeoutType: 'TIMEOUT_TYPE_START_TO_CLOSE' },
          },
          {
            eventId: '7',
            eventType: 'EVENT_TYPE_WORKFLOW_EXECUTION_COMPLETED',
            eventTime: '2024-01-02T12:00:14Z',
            workflowExecutionCompletedEventAttributes: { result: input({ groupId: 'B' }) },
          },
        ],
      },
    };
    await atomicWrite(historyPath(root, 'run'), JSON.stringify(envelope));
    const analysis = path.join(root, 'analysis');
    const cwd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    execFileSync(
      process.execPath,
      ['--import', 'tsx', 'src/commands/analyze.ts', '--histories', root, '--out', analysis],
      {
        cwd,
      },
    );
    const saved = JSON.parse(await readFile(analysisPath(analysis, envelope.runId), 'utf8'));
    assert.equal(saved.kind, 'run-analysis');
    assert.equal(saved.formatVersion, 1);
    assert.deepEqual(saved.extractions.executionTimes, {
      startTime: '2024-01-02T10:00:00.000Z',
      closeTime: '2024-01-02T12:00:14.000Z',
    });
    assert.deepEqual(saved.extractions.application.groupIds, [
      { eventId: '1', value: 'A' },
      { eventId: '7', value: 'B' },
    ]);
    assert.equal('observations' in saved, false);
    const stdout = execFileSync(
      process.execPath,
      [
        '--import',
        'tsx',
        'src/commands/query.ts',
        '--analysis',
        analysis,
        '--identity',
        'worker-1',
        '--from',
        '2024-01-02T11:00:00Z',
      ],
      { cwd, encoding: 'utf8' },
    );
    const match = JSON.parse(stdout.trim());
    assert.equal(match.workflowId, 'id');
    assert.equal(match.startTime, '2024-01-02T10:00:00.000Z');
    assert.equal(match.closeTime, '2024-01-02T12:00:14.000Z');
    assert.equal(match.matchingWorkflowTasks[0].buildId, 'build-1');
    assert.deepEqual(
      match.matchingWorkflowTasks.map((task: { status: string }) => task.status),
      ['completed', 'failed', 'timed-out'],
    );
    const timedOut = execFileSync(
      process.execPath,
      [
        '--import',
        'tsx',
        'src/commands/query.ts',
        '--analysis',
        analysis,
        '--identity',
        'worker-1',
        '--build-id',
        'build-1',
        '--from',
        '2024-01-02T12:00:03Z',
        '--to',
        '2024-01-02T12:00:05Z',
      ],
      { cwd, encoding: 'utf8' },
    );
    const timeMatch = JSON.parse(timedOut.trim());
    assert.deepEqual(
      timeMatch.matchingWorkflowTasks.map((task: { status: string }) => task.status),
      ['timed-out'],
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

void test('rejects analysis files using the old flat output schema with a regeneration instruction', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'workflow-history-audit-'));
  try {
    await atomicWrite(analysisPath(root, 'old-run'), JSON.stringify({ formatVersion: 1, workflowTasks: [] }));
    const cwd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const result = spawnSync(
      process.execPath,
      ['--import', 'tsx', 'src/commands/query.ts', '--analysis', root, '--identity', 'worker-1'],
      { cwd, encoding: 'utf8' },
    );
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Invalid run-analysis v1 envelope/);
    assert.match(result.stderr, /Rerun analyze with an empty output directory/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
