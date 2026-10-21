import assert from 'node:assert/strict';
import test from 'node:test';
import { historyFromJSON } from '@temporalio/common/lib/proto-utils.js';
import { WorkflowTasksExtractor, type WorkflowTask } from '../src/extractors/workflow-tasks.js';
import { decodeHistoryPayloads, decodedEventPayloads } from '../src/internal/history-payload-decoder.js';
import type { HistoryEventJson } from '../src/internal/history-storage.js';

function started(eventId = '2', scheduledEventId = '1'): HistoryEventJson {
  return {
    eventId,
    eventType: 'EVENT_TYPE_WORKFLOW_TASK_STARTED',
    eventTime: '2024-01-02T12:00:00Z',
    workflowTaskStartedEventAttributes: {
      scheduledEventId,
      identity: 'starting-worker',
      workerVersion: { buildId: 'starting-build' },
    },
  };
}

async function extract(events: HistoryEventJson[]): Promise<WorkflowTask[]> {
  const history = historyFromJSON({ events });
  const decoded = await decodeHistoryPayloads(history, [], {
    namespace: 'test',
    workflowId: 'workflow-1',
    runId: 'run-1',
    taskQueue: 'example-queue',
  });
  const extractor = new WorkflowTasksExtractor();
  for (const event of decoded.events ?? []) {
    extractor.onEvent({
      event,
      payloads: event[decodedEventPayloads],
      payloadToValue: () => {
        throw new Error('Workflow Task metadata must not convert payloads');
      },
    });
  }
  return JSON.parse(JSON.stringify(extractor.finish()));
}

void test('records start metadata and enriches a completed task with its reported deployment Build ID', async () => {
  const tasks = await extract([
    started(),
    {
      eventId: '3',
      eventType: 'EVENT_TYPE_WORKFLOW_TASK_COMPLETED',
      eventTime: '2024-01-02T12:00:01Z',
      workflowTaskCompletedEventAttributes: {
        scheduledEventId: '1',
        startedEventId: '2',
        identity: 'finishing-worker',
        deploymentVersion: { deploymentName: 'deployment', buildId: 'reported-build' },
        workerVersion: { buildId: 'legacy-build' },
      },
    },
  ]);
  assert.deepEqual(tasks, [
    {
      scheduledEventId: '1',
      startedEventId: '2',
      finishedEventId: '3',
      startedAt: '2024-01-02T12:00:00.000Z',
      finishedAt: '2024-01-02T12:00:01.000Z',
      status: 'completed',
      identity: 'starting-worker',
      buildId: 'reported-build',
    },
  ]);
});

void test('keeps the starting worker on server-generated failures and records the failure cause', async () => {
  const tasks = await extract([
    started(),
    {
      eventId: '3',
      eventType: 'EVENT_TYPE_WORKFLOW_TASK_FAILED',
      eventTime: '2024-01-02T12:00:01Z',
      workflowTaskFailedEventAttributes: {
        scheduledEventId: '1',
        startedEventId: '2',
        identity: 'history-service',
        cause: 'WORKFLOW_TASK_FAILED_CAUSE_NON_DETERMINISTIC_ERROR',
      },
    },
  ]);
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].status, 'failed');
  assert.equal(tasks[0].identity, 'starting-worker');
  assert.equal(tasks[0].buildId, 'starting-build');
  assert.equal(tasks[0].failureCause, 24);
  assert.equal(tasks[0].finishedEventId, '3');
});

void test('retains start metadata for timed-out tasks', async () => {
  const tasks = await extract([
    started(),
    {
      eventId: '3',
      eventType: 'EVENT_TYPE_WORKFLOW_TASK_TIMED_OUT',
      eventTime: '2024-01-02T12:00:10Z',
      workflowTaskTimedOutEventAttributes: {
        scheduledEventId: '1',
        startedEventId: '2',
        timeoutType: 'TIMEOUT_TYPE_START_TO_CLOSE',
      },
    },
  ]);
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].status, 'timed-out');
  assert.equal(tasks[0].identity, 'starting-worker');
  assert.equal(tasks[0].buildId, 'starting-build');
  assert.equal(tasks[0].timeoutType, 1);
  assert.equal(tasks[0].finishedAt, '2024-01-02T12:00:10.000Z');
});

void test('records tasks that started but have no terminal event', async () => {
  assert.deepEqual(await extract([started()]), [
    {
      scheduledEventId: '1',
      startedEventId: '2',
      startedAt: '2024-01-02T12:00:00.000Z',
      status: 'started',
      identity: 'starting-worker',
      buildId: 'starting-build',
    },
  ]);
});

void test('records a timeout without a started task and does not invent a worker or event zero', async () => {
  const tasks = await extract([
    {
      eventId: '3',
      eventType: 'EVENT_TYPE_WORKFLOW_TASK_TIMED_OUT',
      eventTime: '2024-01-02T12:00:10Z',
      workflowTaskTimedOutEventAttributes: {
        scheduledEventId: '1',
        startedEventId: '0',
        timeoutType: 'TIMEOUT_TYPE_SCHEDULE_TO_START',
      },
    },
  ]);
  assert.deepEqual(tasks, [
    {
      scheduledEventId: '1',
      finishedEventId: '3',
      finishedAt: '2024-01-02T12:00:10.000Z',
      status: 'timed-out',
      timeoutType: 2,
    },
  ]);
});

void test('recovers available worker metadata when the start event is missing', async () => {
  const tasks = await extract([
    {
      eventId: '3',
      eventType: 'EVENT_TYPE_WORKFLOW_TASK_COMPLETED',
      eventTime: '2024-01-02T12:00:01Z',
      workflowTaskCompletedEventAttributes: {
        scheduledEventId: '1',
        startedEventId: '2',
        identity: 'finishing-worker',
        binaryChecksum: 'legacy-build',
      },
    },
  ]);
  assert.equal(tasks[0].identity, 'finishing-worker');
  assert.equal(tasks[0].buildId, 'legacy-build');
  assert.equal(tasks[0].startedEventId, '2');
  assert.equal(tasks[0].startedAt, undefined);
  assert.equal(tasks[0].status, 'completed');
});

void test('keeps retry attempts separate', async () => {
  const tasks = await extract([
    started(),
    {
      eventId: '3',
      eventType: 'EVENT_TYPE_WORKFLOW_TASK_FAILED',
      eventTime: '2024-01-02T12:00:01Z',
      workflowTaskFailedEventAttributes: { scheduledEventId: '1', startedEventId: '2' },
    },
    started('5', '4'),
    {
      eventId: '6',
      eventType: 'EVENT_TYPE_WORKFLOW_TASK_COMPLETED',
      eventTime: '2024-01-02T12:00:02Z',
      workflowTaskCompletedEventAttributes: { scheduledEventId: '4', startedEventId: '5' },
    },
  ]);
  assert.deepEqual(
    tasks.map(({ startedEventId, status }) => [startedEventId, status]),
    [
      ['2', 'failed'],
      ['5', 'completed'],
    ],
  );
});
