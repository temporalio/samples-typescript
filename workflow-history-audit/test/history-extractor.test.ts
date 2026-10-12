import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultPayloadConverter } from '@temporalio/common';
import { historyFromJSON } from '@temporalio/common/lib/proto-utils.js';
import {
  CompositeExtractor,
  type EventContext,
  type ExecutionMetadata,
  type HistoryExtractor,
} from '../src/internal/history-extractor.js';
import {
  decodeHistoryPayloads,
  decodedEventPayloads,
  eventSerializationContext,
} from '../src/internal/history-payload-decoder.js';

const execution: ExecutionMetadata = {
  namespace: 'test',
  workflowId: 'workflow-1',
  runId: 'run-1',
  taskQueue: 'example-queue',
};

async function eventContexts(): Promise<EventContext[]> {
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
  const decoded = await decodeHistoryPayloads(history, [], execution);
  return decoded.events!.map(
    (event): EventContext => ({
      event,
      payloads: event[decodedEventPayloads],
      payloadToValue: (payload) => defaultPayloadConverter.fromPayload(payload, event[eventSerializationContext]),
    }),
  );
}

void test('creates fresh per-history instances and keeps same-named output fields in separate namespaces', async () => {
  const calls: string[] = [];
  class RecordingExtractor {
    private readonly eventIds: string[] = [];

    public constructor(private readonly metadata: ExecutionMetadata) {
      calls.push(`construct:${metadata.runId}`);
    }

    public onEvent({ event }: EventContext): void {
      this.eventIds.push(event.eventId!.toString());
      calls.push(`event:${event.eventId}`);
    }

    public finish() {
      calls.push(`finish:${this.metadata.runId}`);
      return { workflowId: this.metadata.workflowId, eventIds: this.eventIds, count: this.eventIds.length };
    }
  }
  const registry = { first: RecordingExtractor, second: RecordingExtractor };
  const contexts = await eventContexts();
  const firstHistory = new CompositeExtractor(registry, execution);
  for (const context of contexts) firstHistory.onEvent(context);
  const result = firstHistory.finish();

  assert.deepEqual(result, {
    first: { workflowId: 'workflow-1', eventIds: ['1', '2'], count: 2 },
    second: { workflowId: 'workflow-1', eventIds: ['1', '2'], count: 2 },
  });
  assert.notStrictEqual(result.first?.eventIds, result.second?.eventIds);
  assert.deepEqual(calls, [
    'construct:run-1',
    'construct:run-1',
    'event:1',
    'event:1',
    'event:2',
    'event:2',
    'finish:run-1',
    'finish:run-1',
  ]);

  const secondHistory = new CompositeExtractor(registry, { ...execution, workflowId: 'workflow-2', runId: 'run-2' });
  secondHistory.onEvent(contexts[0]);
  assert.deepEqual(secondHistory.finish(), {
    first: { workflowId: 'workflow-2', eventIds: ['1'], count: 1 },
    second: { workflowId: 'workflow-2', eventIds: ['1'], count: 1 },
  });
  assert.deepEqual(result.first?.eventIds, ['1', '2']);
  assert.equal(calls.filter((call) => call.startsWith('construct:')).length, 4);
});

function constantExtractor<Output>(output: Output) {
  return class implements HistoryExtractor<Output> {
    public onEvent(): void {
      return;
    }

    public finish(): Output {
      return output;
    }
  };
}

void test('omits only undefined output and retains empty or falsy results', () => {
  const extractor = new CompositeExtractor(
    {
      absent: constantExtractor(undefined),
      emptyArray: constantExtractor([]),
      emptyObject: constantExtractor({}),
      nullValue: constantExtractor(null),
      zero: constantExtractor(0),
      falseValue: constantExtractor(false),
    },
    execution,
  );
  assert.deepEqual(extractor.finish(), {
    emptyArray: [],
    emptyObject: {},
    nullValue: null,
    zero: 0,
    falseValue: false,
  });
});

void test('propagates event processing and finalization errors', async () => {
  const [context] = await eventContexts();
  const eventError = new Error('event failed');
  class EventFailure {
    public onEvent(): void {
      throw eventError;
    }

    public finish(): undefined {
      return undefined;
    }
  }
  const eventExtractor = new CompositeExtractor({ failing: EventFailure }, execution);
  assert.throws(() => eventExtractor.onEvent(context), eventError);

  const finishError = new Error('finish failed');
  class FinishFailure {
    public onEvent(): void {
      return;
    }

    public finish(): never {
      throw finishError;
    }
  }
  const finishExtractor = new CompositeExtractor({ failing: FinishFailure }, execution);
  finishExtractor.onEvent(context);
  assert.throws(() => finishExtractor.finish(), finishError);
});
