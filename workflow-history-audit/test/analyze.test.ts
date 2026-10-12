import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  defaultDataConverter,
  defaultPayloadConverter,
  type Payload,
  type SerializationContext,
} from '@temporalio/common';
import { payloadToJSON } from '@temporalio/common/lib/proto-utils.js';
import { analyzeHistory } from '../src/commands/analyze.js';
import { parseAnalyzeOptions } from '../src/commands/cli.js';
import {
  analysisPath,
  atomicWrite,
  historyPath,
  type HistoryEnvelope,
  type HistoryEventJson,
} from '../src/internal/history-storage.js';

function input(value: unknown): { payloads: unknown[] } {
  const payload = defaultPayloadConverter.toPayload(value);
  assert.ok(payload);
  return { payloads: [payloadToJSON(payload)] };
}

void test('extracts event values and records worker identity and build ID', async () => {
  const events: HistoryEventJson[] = [
    {
      eventId: '1',
      eventType: 'EVENT_TYPE_WORKFLOW_EXECUTION_STARTED',
      eventTime: '2024-01-02T10:00:00Z',
      workflowExecutionStartedEventAttributes: { input: input({ groupId: 'group-A', recordId: 42 }) },
    },
    {
      eventId: '2',
      eventType: 'EVENT_TYPE_WORKFLOW_TASK_STARTED',
      eventTime: '2024-01-02T12:00:00Z',
      workflowTaskStartedEventAttributes: {},
    },
    {
      eventId: '3',
      eventType: 'EVENT_TYPE_WORKFLOW_TASK_COMPLETED',
      eventTime: '2024-01-02T12:00:01Z',
      workflowTaskCompletedEventAttributes: {
        startedEventId: '2',
        identity: 'worker-1',
        workerVersion: { buildId: 'build-1' },
      },
    },
    {
      eventId: '4',
      eventType: 'EVENT_TYPE_ACTIVITY_TASK_SCHEDULED',
      eventTime: '2024-01-02T12:00:01Z',
      activityTaskScheduledEventAttributes: { activityId: 'activity-1', input: input({ groupId: 'group-B' }) },
    },
    {
      eventId: '5',
      eventType: 'EVENT_TYPE_ACTIVITY_TASK_COMPLETED',
      eventTime: '2024-01-02T12:00:02Z',
      activityTaskCompletedEventAttributes: { scheduledEventId: '4', result: input({ recordId: 42 }) },
    },
    {
      eventId: '6',
      eventType: 'EVENT_TYPE_SIGNAL_EXTERNAL_WORKFLOW_EXECUTION_INITIATED',
      eventTime: '2024-01-02T12:00:03Z',
      signalExternalWorkflowExecutionInitiatedEventAttributes: {
        namespace: 'target-namespace',
        workflowExecution: { workflowId: 'target-workflow' },
        input: input({ groupId: 'group-A' }),
      },
    },
    {
      eventId: '7',
      eventType: 'EVENT_TYPE_WORKFLOW_EXECUTION_COMPLETED',
      eventTime: '2024-01-02T12:00:04Z',
      workflowExecutionCompletedEventAttributes: { result: input({ recordId: 99 }) },
    },
  ];
  const envelope: HistoryEnvelope = {
    kind: 'workflow-history',
    formatVersion: 1,
    namespace: 'test',
    workflowId: 'workflow-1',
    runId: 'run-1',
    taskQueue: 'example-queue',
    history: { events },
  };
  const contexts: unknown[] = [];
  const converterContexts: unknown[] = [];
  const originalHistory = JSON.stringify(envelope);
  const result = await analyzeHistory(
    {
      ...defaultDataConverter,
      payloadConverter: {
        toPayload: (value, context) => defaultPayloadConverter.toPayload(value, context),
        fromPayload: <T>(payload: Payload, context?: SerializationContext): T => {
          converterContexts.push(context);
          return defaultPayloadConverter.fromPayload<T>(payload, context);
        },
      },
      payloadCodecs: [
        {
          encode: async (payloads) => payloads,
          decode: async (payloads, context) => {
            assert.deepEqual(converterContexts, []);
            contexts.push(context);
            return payloads;
          },
        },
      ],
    },
    envelope,
  );
  assert.equal(JSON.stringify(envelope), originalHistory);
  assert.deepEqual(Object.keys(JSON.parse(JSON.stringify(result))).sort(), [
    'extractions',
    'formatVersion',
    'kind',
    'namespace',
    'runId',
    'taskQueue',
    'workflowId',
  ]);
  assert.deepEqual(result.extractions.executionTimes, {
    startTime: '2024-01-02T10:00:00.000Z',
    closeTime: '2024-01-02T12:00:04.000Z',
  });
  assert.deepEqual(JSON.parse(JSON.stringify(result.extractions.workflowTasks)), [
    {
      startedEventId: '2',
      finishedEventId: '3',
      startedAt: '2024-01-02T12:00:00.000Z',
      finishedAt: '2024-01-02T12:00:01.000Z',
      status: 'completed',
      identity: 'worker-1',
      buildId: 'build-1',
    },
  ]);
  assert.deepEqual(result.extractions.application, {
    groupIds: [
      { eventId: '1', value: 'group-A' },
      { eventId: '4', value: 'group-B' },
      { eventId: '6', value: 'group-A' },
    ],
    recordIds: [
      { eventId: '1', value: 42 },
      { eventId: '5', value: 42 },
      { eventId: '7', value: 99 },
    ],
  });
  assert.deepEqual(contexts, [
    { type: 'workflow', namespace: 'test', workflowId: 'workflow-1' },
    { type: 'activity', namespace: 'test', workflowId: 'workflow-1', activityId: 'activity-1', isLocal: false },
    { type: 'activity', namespace: 'test', workflowId: 'workflow-1', activityId: 'activity-1', isLocal: false },
    { type: 'workflow', namespace: 'target-namespace', workflowId: 'target-workflow' },
    { type: 'workflow', namespace: 'test', workflowId: 'workflow-1' },
  ]);
  assert.deepEqual(converterContexts, contexts);
});

void test('extracts properties from all visited event values, including memos, received signals, and failures', async () => {
  const envelope: HistoryEnvelope = {
    kind: 'workflow-history',
    formatVersion: 1,
    namespace: 'test',
    workflowId: 'workflow-1',
    runId: 'run-1',
    taskQueue: 'example-queue',
    history: {
      events: [
        {
          eventId: '1',
          eventType: 'EVENT_TYPE_WORKFLOW_EXECUTION_STARTED',
          eventTime: '2024-01-02T10:00:00Z',
          workflowExecutionStartedEventAttributes: {
            input: input({ groupId: 'input' }),
            memo: { fields: { example: input({ groupId: 'memo' }).payloads[0] } },
          },
        },
        {
          eventId: '2',
          eventType: 'EVENT_TYPE_WORKFLOW_EXECUTION_SIGNALED',
          eventTime: '2024-01-02T11:00:00Z',
          workflowExecutionSignaledEventAttributes: { input: input({ groupId: 'signal' }) },
        },
        {
          eventId: '3',
          eventType: 'EVENT_TYPE_WORKFLOW_EXECUTION_FAILED',
          eventTime: '2024-01-02T12:00:00Z',
          workflowExecutionFailedEventAttributes: {
            failure: { applicationFailureInfo: { details: input({ groupId: 'failure' }) } },
          },
        },
      ],
    },
  };
  const result = await analyzeHistory(defaultDataConverter, envelope);
  assert.deepEqual(result.extractions.application, {
    groupIds: [
      { eventId: '1', value: 'input' },
      { eventId: '1', value: 'memo' },
      { eventId: '2', value: 'signal' },
      { eventId: '3', value: 'failure' },
    ],
    recordIds: [],
  });
});

void test('preserves protobuf event IDs beyond the JavaScript safe integer range', async () => {
  const envelope: HistoryEnvelope = {
    kind: 'workflow-history',
    formatVersion: 1,
    namespace: 'test',
    workflowId: 'workflow-1',
    runId: 'run-1',
    taskQueue: 'example-queue',
    history: {
      events: [
        {
          eventId: '9007199254740993',
          eventType: 'EVENT_TYPE_WORKFLOW_TASK_STARTED',
          eventTime: '2024-01-02T12:00:00Z',
          workflowTaskStartedEventAttributes: {},
        },
        {
          eventId: '9007199254740994',
          eventType: 'EVENT_TYPE_WORKFLOW_TASK_COMPLETED',
          eventTime: '2024-01-02T12:00:01Z',
          workflowTaskCompletedEventAttributes: { startedEventId: '9007199254740993', identity: 'worker-1' },
        },
      ],
    },
  };
  const result = await analyzeHistory(defaultDataConverter, envelope);
  assert.equal(result.extractions.workflowTasks?.[0]?.finishedEventId, '9007199254740994');
  assert.equal(result.extractions.workflowTasks?.[0]?.startedAt, '2024-01-02T12:00:00.000Z');
  assert.equal('application' in result.extractions, false);
});

void test('execution time extraction requires timestamps on the first and last events', async () => {
  const events: HistoryEventJson[] = [
    {
      eventId: '1',
      eventType: 'EVENT_TYPE_WORKFLOW_TASK_STARTED',
      eventTime: '2024-01-02T12:00:00Z',
      workflowTaskStartedEventAttributes: {},
    },
    {
      eventId: '2',
      eventType: 'EVENT_TYPE_WORKFLOW_TASK_COMPLETED',
      eventTime: '2024-01-02T12:00:01Z',
      workflowTaskCompletedEventAttributes: { startedEventId: '1' },
    },
  ];
  const envelope: HistoryEnvelope = {
    kind: 'workflow-history',
    formatVersion: 1,
    namespace: 'test',
    workflowId: 'workflow-1',
    runId: 'run-1',
    taskQueue: 'example-queue',
    history: { events },
  };
  const missingFirstTime = { ...events[0] };
  const missingLastTime = { ...events[1] };
  delete missingFirstTime.eventTime;
  delete missingLastTime.eventTime;
  for (const incomplete of [[], [missingFirstTime, events[1]], [events[0], missingLastTime]]) {
    await assert.rejects(
      analyzeHistory(defaultDataConverter, { ...envelope, history: { events: incomplete } }),
      /History run-1 is missing event times/,
    );
  }
});

void test('skips an existing analysis file', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'workflow-history-audit-'));
  try {
    const historiesDirectory = path.join(root, 'input');
    const analysisDirectory = path.join(root, 'output');
    const envelope: HistoryEnvelope = {
      kind: 'workflow-history',
      formatVersion: 1,
      namespace: 'test',
      workflowId: 'workflow-1',
      runId: 'run-1',
      taskQueue: 'example-queue',
      history: { events: [] },
    };
    await atomicWrite(historyPath(historiesDirectory, envelope.runId), JSON.stringify(envelope));
    const existingAnalysis = analysisPath(analysisDirectory, envelope.runId);
    await atomicWrite(existingAnalysis, 'existing analysis');

    const cwd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const result = spawnSync(
      process.execPath,
      ['--import', 'tsx', 'src/commands/analyze.ts', '--histories', historiesDirectory, '--out', analysisDirectory],
      { cwd, encoding: 'utf8' },
    );

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Skipped: 1/);
    assert.equal(await readFile(existingAnalysis, 'utf8'), 'existing analysis');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

void test('parses analyze options', () => {
  assert.deepEqual(parseAnalyzeOptions(['--histories', './histories', '--out', './analysis']), {
    historiesDirectory: './histories',
    analysisDirectory: './analysis',
    concurrency: 10,
  });
});

void test('validates required analyze options', () => {
  assertAnalyzeOptionsError(['--histories', './histories'], /Missing --out/);
  assertAnalyzeOptionsError(
    ['--histories', './histories', '--out', './analysis', '--concurrency', '0'],
    /--concurrency must be a positive integer/,
  );
});

void test('provides help without requiring other arguments', () => {
  const cwd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/commands/analyze.ts', '--help'], {
    cwd,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout + result.stderr, /^Usage: npm run analyze/);
});

function assertAnalyzeOptionsError(args: string[], expected: RegExp): void {
  const originalConsoleError = console.error;
  const originalExitCode = process.exitCode;
  const errors: string[] = [];
  console.error = (...values: unknown[]) => errors.push(values.map(String).join(' '));
  process.exitCode = undefined;
  try {
    assert.equal(parseAnalyzeOptions(args), undefined);
    assert.match(errors.join('\n'), expected);
    assert.equal(process.exitCode, 1);
  } finally {
    console.error = originalConsoleError;
    process.exitCode = originalExitCode;
  }
}
