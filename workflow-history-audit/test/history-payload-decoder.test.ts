import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultPayloadConverter, type Payload, type SerializationContext } from '@temporalio/common';
import { historyFromJSON, historyToJSON, payloadToJSON } from '@temporalio/common/lib/proto-utils.js';
import type { ExecutionMetadata } from '../src/internal/history-extractor.js';
import {
  decodeHistoryPayloads,
  decodedEventPayloads,
  eventSerializationContext,
} from '../src/internal/history-payload-decoder.js';

function payload(value: unknown): unknown {
  const result = defaultPayloadConverter.toPayload(value);
  assert.ok(result);
  return payloadToJSON(result);
}

function valuesFromPayloads(payloads: readonly Payload[]): unknown[] {
  return payloads.map((payload) => defaultPayloadConverter.fromPayload(payload));
}

const workflowContext = { type: 'workflow', namespace: 'test', workflowId: 'workflow-1' } as const;
const execution: ExecutionMetadata = {
  namespace: workflowContext.namespace,
  workflowId: workflowContext.workflowId,
  runId: 'run-1',
  taskQueue: 'example-queue',
};

void test('visits schema-defined payload arrays, map values, metadata, and nested failures in place', async () => {
  const history = historyFromJSON({
    events: [
      {
        eventId: '1',
        eventType: 'EVENT_TYPE_WORKFLOW_EXECUTION_STARTED',
        userMetadata: { summary: payload('summary') },
        workflowExecutionStartedEventAttributes: {
          input: { payloads: [payload('arg-1'), payload('arg-2')] },
          memo: { fields: { example: payload({ groupId: 'group-A' }) } },
        },
      },
      {
        eventId: '2',
        eventType: 'EVENT_TYPE_WORKFLOW_EXECUTION_FAILED',
        workflowExecutionFailedEventAttributes: {
          failure: {
            encodedAttributes: payload({ message: 'failure', stack_trace: 'stack' }),
            cause: { applicationFailureInfo: { details: { payloads: [payload('nested failure')] } } },
          },
        },
      },
    ],
  });
  const event = history.events![0];
  const customData = { payloads: [payload('not a schema-defined payload field')] };
  Object.assign(event, { customData });
  const decoded = await decodeHistoryPayloads(history, [], execution);

  assert.strictEqual(decoded, history);
  assert.strictEqual(decoded.events![0], event);
  assert.deepEqual(customData, { payloads: [payload('not a schema-defined payload field')] });
  assert.equal(defaultPayloadConverter.fromPayload(decoded.events![0].userMetadata!.summary!), 'summary');
  const attrs = decoded.events![0].workflowExecutionStartedEventAttributes!;
  assert.deepEqual(valuesFromPayloads(attrs.input?.payloads ?? []), ['arg-1', 'arg-2']);
  assert.deepEqual(defaultPayloadConverter.fromPayload(attrs.memo!.fields!.example), {
    groupId: 'group-A',
  });
  const failure = decoded.events![1].workflowExecutionFailedEventAttributes?.failure;
  assert.deepEqual(defaultPayloadConverter.fromPayload(failure!.encodedAttributes!), {
    message: 'failure',
    stack_trace: 'stack',
  });
  assert.deepEqual(valuesFromPayloads(failure?.cause?.applicationFailureInfo?.details?.payloads ?? []), [
    'nested failure',
  ]);
  assert.deepEqual(valuesFromPayloads(decoded.events![0][decodedEventPayloads]), [
    'summary',
    'arg-1',
    'arg-2',
    { groupId: 'group-A' },
  ]);
  assert.deepEqual(valuesFromPayloads(decoded.events![1][decodedEventPayloads]), [
    { message: 'failure', stack_trace: 'stack' },
    'nested failure',
  ]);
  assert.strictEqual(
    decoded.events![0][decodedEventPayloads][3],
    decoded.events![0].workflowExecutionStartedEventAttributes?.memo?.fields?.example,
  );
});

void test('preserves codec-decoded Payloads without applying a payload converter', async () => {
  const encodedPayload: Payload = {
    metadata: { encoding: Buffer.from('sample/encoded') },
    data: Buffer.from('encoded bytes'),
  };
  const decodedPayload: Payload = {
    metadata: { encoding: Buffer.from('sample/decoded') },
    data: Buffer.from('decoded bytes'),
  };
  const history = historyFromJSON({
    events: [
      {
        eventId: '1',
        eventType: 'EVENT_TYPE_WORKFLOW_EXECUTION_STARTED',
        workflowExecutionStartedEventAttributes: {
          input: { payloads: [payloadToJSON(encodedPayload)] },
          memo: { fields: { example: payloadToJSON(encodedPayload) } },
        },
      },
    ],
  });
  const decoded = await decodeHistoryPayloads(
    history,
    [
      {
        encode: async (payloads) => payloads,
        decode: async (payloads) => {
          for (const payload of payloads) {
            assert.deepEqual(payload.data, encodedPayload.data);
            assert.deepEqual(payload.metadata?.encoding, encodedPayload.metadata?.encoding);
          }
          return payloads.map(() => decodedPayload);
        },
      },
    ],
    execution,
  );
  const event = decoded.events![0];
  assert.deepEqual(event[decodedEventPayloads], [decodedPayload, decodedPayload]);
  assert.strictEqual(event.workflowExecutionStartedEventAttributes?.input?.payloads?.[0], decodedPayload);
  assert.strictEqual(event.workflowExecutionStartedEventAttributes?.memo?.fields?.example, decodedPayload);
  // This encoding requires an application-specific PayloadConverter. Codec decoding
  // still succeeds and leaves a tree that can be serialized as protobuf.
  assert.throws(() => defaultPayloadConverter.fromPayload(decodedPayload));
  const serialized = JSON.parse(historyToJSON(decoded));
  assert.deepEqual(
    serialized.events[0].workflowExecutionStartedEventAttributes.input.payloads[0],
    payloadToJSON(decodedPayload),
  );
});

void test('annotates payload-free events with separate non-enumerable, read-only symbol collections', async () => {
  const history = historyFromJSON({
    events: [
      {
        eventId: '1',
        eventType: 'EVENT_TYPE_WORKFLOW_TASK_STARTED',
        workflowTaskStartedEventAttributes: {},
      },
      {
        eventId: '2',
        eventType: 'EVENT_TYPE_WORKFLOW_TASK_COMPLETED',
        workflowTaskCompletedEventAttributes: { startedEventId: '1' },
      },
    ],
  });
  const originalJSON = JSON.stringify(history);
  const decoded = await decodeHistoryPayloads(history, [], execution);
  const events = decoded.events!;

  assert.deepEqual(
    events.map((event) => event[decodedEventPayloads]),
    [[], []],
  );
  assert.notStrictEqual(events[0][decodedEventPayloads], events[1][decodedEventPayloads]);
  for (const event of events) {
    for (const symbol of [decodedEventPayloads, eventSerializationContext]) {
      const descriptor = Object.getOwnPropertyDescriptor(event, symbol);
      assert.equal(descriptor?.enumerable, false);
      assert.equal(descriptor?.writable, false);
      assert.equal(descriptor?.configurable, false);
      assert.equal(Reflect.has({ ...event }, symbol), false);
    }
    assert.strictEqual(
      Object.getOwnPropertyDescriptor(event, decodedEventPayloads)?.value,
      event[decodedEventPayloads],
    );
    assert.deepEqual(event[eventSerializationContext], workflowContext);
  }
  assert.equal(JSON.stringify(history), originalJSON);
});

void test('keeps headers and search attributes out of codec processing', async () => {
  const history = historyFromJSON({
    events: [
      {
        eventId: '1',
        eventType: 'EVENT_TYPE_WORKFLOW_EXECUTION_STARTED',
        workflowExecutionStartedEventAttributes: {
          input: { payloads: [payload('input')] },
          header: { fields: { example: payload('header') } },
          searchAttributes: { indexedFields: { example: payload('search attribute') } },
        },
      },
    ],
  });
  const attrs = history.events![0].workflowExecutionStartedEventAttributes!;
  const header = attrs.header?.fields?.example;
  const searchAttribute = attrs.searchAttributes?.indexedFields?.example;
  let codecCalls = 0;
  const decoded = await decodeHistoryPayloads(
    history,
    [
      {
        encode: async (payloads) => payloads,
        decode: async (payloads) => {
          codecCalls++;
          return payloads;
        },
      },
    ],
    execution,
  );

  assert.equal(codecCalls, 1);
  const decodedAttrs = decoded.events![0].workflowExecutionStartedEventAttributes!;
  assert.strictEqual(decodedAttrs.header?.fields?.example, header);
  assert.strictEqual(decodedAttrs.searchAttributes?.indexedFields?.example, searchAttribute);
  assert.deepEqual(valuesFromPayloads(decoded.events![0][decodedEventPayloads]), ['input']);
});

void test('runs codecs in reverse order and lets a payload batch expand to multiple Payloads', async () => {
  const history = historyFromJSON({
    events: [
      {
        eventId: '1',
        eventType: 'EVENT_TYPE_WORKFLOW_EXECUTION_STARTED',
        workflowExecutionStartedEventAttributes: { input: { payloads: [payload('packed')] } },
      },
    ],
  });
  const calls: string[] = [];
  const decoded = await decodeHistoryPayloads(
    history,
    [
      {
        encode: async (payloads) => payloads,
        decode: async (payloads) => {
          calls.push('first');
          assert.equal(defaultPayloadConverter.fromPayload(payloads[0]), 'unwrapped');
          return [defaultPayloadConverter.toPayload('value-1'), defaultPayloadConverter.toPayload('value-2')];
        },
      },
      {
        encode: async (payloads) => payloads,
        decode: async (payloads) => {
          calls.push('second');
          assert.equal(defaultPayloadConverter.fromPayload(payloads[0]), 'packed');
          return [defaultPayloadConverter.toPayload('unwrapped')];
        },
      },
    ],
    execution,
  );

  assert.deepEqual(calls, ['second', 'first']);
  assert.deepEqual(
    valuesFromPayloads(decoded.events![0].workflowExecutionStartedEventAttributes?.input?.payloads ?? []),
    ['value-1', 'value-2'],
  );
  assert.deepEqual(valuesFromPayloads(decoded.events![0][decodedEventPayloads]), ['value-1', 'value-2']);
});

void test('selects and retains activity, external signal, and child workflow contexts', async () => {
  const history = historyFromJSON({
    events: [
      {
        eventId: '1',
        eventType: 'EVENT_TYPE_ACTIVITY_TASK_SCHEDULED',
        userMetadata: { summary: payload('activity metadata') },
        activityTaskScheduledEventAttributes: {
          activityId: 'activity-1',
          input: { payloads: [payload('activity input')] },
        },
      },
      {
        eventId: '2',
        eventType: 'EVENT_TYPE_ACTIVITY_TASK_FAILED',
        activityTaskFailedEventAttributes: {
          scheduledEventId: '1',
          failure: { applicationFailureInfo: { details: { payloads: [payload('activity failure')] } } },
        },
      },
      {
        eventId: '3',
        eventType: 'EVENT_TYPE_SIGNAL_EXTERNAL_WORKFLOW_EXECUTION_INITIATED',
        signalExternalWorkflowExecutionInitiatedEventAttributes: {
          namespace: 'external',
          workflowExecution: { workflowId: 'target' },
          input: { payloads: [payload('signal')] },
        },
      },
      {
        eventId: '4',
        eventType: 'EVENT_TYPE_START_CHILD_WORKFLOW_EXECUTION_INITIATED',
        startChildWorkflowExecutionInitiatedEventAttributes: {
          namespace: 'children',
          workflowId: 'child',
          input: { payloads: [payload('child input')] },
        },
      },
      {
        eventId: '5',
        eventType: 'EVENT_TYPE_CHILD_WORKFLOW_EXECUTION_COMPLETED',
        childWorkflowExecutionCompletedEventAttributes: {
          namespace: 'children',
          workflowExecution: { workflowId: 'child' },
          result: { payloads: [payload('child result')] },
        },
      },
      {
        eventId: '6',
        eventType: 'EVENT_TYPE_WORKFLOW_EXECUTION_COMPLETED',
        workflowExecutionCompletedEventAttributes: { result: { payloads: [payload('workflow result')] } },
      },
    ],
  });
  const codecContexts: Array<SerializationContext | undefined> = [];
  const decoded = await decodeHistoryPayloads(
    history,
    [
      {
        encode: async (payloads) => payloads,
        decode: async (payloads, context) => {
          codecContexts.push(context);
          return payloads;
        },
      },
    ],
    execution,
  );

  const activityContext = {
    type: 'activity',
    namespace: 'test',
    workflowId: 'workflow-1',
    activityId: 'activity-1',
    isLocal: false,
  };
  const contexts = [
    activityContext,
    activityContext,
    activityContext,
    { type: 'workflow', namespace: 'external', workflowId: 'target' },
    { type: 'workflow', namespace: 'children', workflowId: 'child' },
    { type: 'workflow', namespace: 'children', workflowId: 'child' },
    workflowContext,
  ];
  assert.deepEqual(codecContexts, contexts);
  assert.deepEqual(
    decoded.events?.map((event) => event[eventSerializationContext]),
    [
      activityContext,
      activityContext,
      { type: 'workflow', namespace: 'external', workflowId: 'target' },
      { type: 'workflow', namespace: 'children', workflowId: 'child' },
      { type: 'workflow', namespace: 'children', workflowId: 'child' },
      workflowContext,
    ],
  );
  assert.deepEqual(
    decoded.events?.map((event) => valuesFromPayloads(event[decodedEventPayloads])),
    [
      ['activity metadata', 'activity input'],
      ['activity failure'],
      ['signal'],
      ['child input'],
      ['child result'],
      ['workflow result'],
    ],
  );
});

void test('propagates codec failures', async () => {
  const history = historyFromJSON({
    events: [
      {
        eventId: '1',
        eventType: 'EVENT_TYPE_WORKFLOW_EXECUTION_STARTED',
        workflowExecutionStartedEventAttributes: { input: { payloads: [payload('input')] } },
      },
    ],
  });
  const error = new Error('codec failed');
  await assert.rejects(
    decodeHistoryPayloads(
      history,
      [
        {
          encode: async (payloads) => payloads,
          decode: async () => {
            throw error;
          },
        },
      ],
      execution,
    ),
    error,
  );
});
