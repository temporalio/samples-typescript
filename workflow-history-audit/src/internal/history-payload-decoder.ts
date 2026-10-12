import type {
  ActivitySerializationContext,
  PayloadCodec,
  SerializationContext,
  WorkflowSerializationContext,
} from '@temporalio/common';
import {
  decode,
  visit,
  walkGetWorkflowExecutionHistoryResponse,
  type DecodedPayload,
  type VisitOptions,
} from '@temporalio/common/lib/internal-non-workflow/index.js';
import type { temporal } from '@temporalio/proto';
import type { ExecutionMetadata } from './history-extractor.js';

export const decodedEventPayloads = Symbol('decodedEventPayloads');
export const eventSerializationContext = Symbol('eventSerializationContext');

export type DecodedHistoryEvent = temporal.api.history.v1.IHistoryEvent & {
  readonly [decodedEventPayloads]: DecodedPayload[];
  readonly [eventSerializationContext]: SerializationContext;
};

export type DecodedHistory = Omit<temporal.api.history.v1.IHistory, 'events'> & {
  events?: DecodedHistoryEvent[] | null;
};

interface EventPayloadContext {
  serializationContext: SerializationContext;
  payloads: DecodedPayload[];
}

/**
 * Applies payload codecs to a rehydrated History in place.
 * Codec-decoded Payloads are collected on every event under
 * {@link decodedEventPayloads}, including empty lists for payload-free events.
 */
export async function decodeHistoryPayloads(
  history: temporal.api.history.v1.IHistory,
  codecs: PayloadCodec[],
  execution: ExecutionMetadata,
): Promise<DecodedHistory> {
  const workflowContext: WorkflowSerializationContext = {
    type: 'workflow',
    namespace: execution.namespace,
    workflowId: execution.workflowId,
  };
  const activities = new Map<string, ActivitySerializationContext>();
  const options: VisitOptions<EventPayloadContext | undefined> = {
    skipHeaders: true,
    skipSearchAttributes: true,
    transformPayload: async (payload, context) => {
      if (context === undefined) return payload;
      const decoded = (await decode(codecs, [payload], context.serializationContext))[0]!;
      context.payloads.push(decoded);
      return decoded;
    },
    transformPayloads: async (payloads, context) => {
      if (context === undefined) return payloads;
      const decoded = await decode(codecs, payloads, context.serializationContext);
      for (const payload of decoded) context.payloads.push(payload);
      return decoded;
    },
    deriveContext: (message, typeName, context) => {
      // The current History walker does not honor skipHeaders for API Header
      // messages. An undefined context makes their transforms pass through.
      if (typeName === 'temporal.api.common.v1.Header') return undefined;
      if (typeName !== 'temporal.api.history.v1.HistoryEvent') return context;
      const event = message as temporal.api.history.v1.IHistoryEvent;
      const payloads: DecodedPayload[] = [];
      const serializationContext = contextForEvent(event, workflowContext, activities);
      Object.defineProperties(event, {
        [decodedEventPayloads]: { value: payloads },
        [eventSerializationContext]: { value: serializationContext },
      });
      return { serializationContext, payloads };
    },
  };

  // The SDK visitor has no History entrypoint, so we wrap it in a synthetic
  // GetWorkflowExecutionHistoryResponse to reuse its schema-aware traversal.
  const response: temporal.api.workflowservice.v1.IGetWorkflowExecutionHistoryResponse = { history };
  await visit(response, walkGetWorkflowExecutionHistoryResponse, options);

  return history as DecodedHistory;
}

/**
 * Emulate the SDK's serialization context construction logic.
 */
function contextForEvent(
  event: temporal.api.history.v1.IHistoryEvent,
  workflowContext: WorkflowSerializationContext,
  activities: Map<string, ActivitySerializationContext>,
): SerializationContext {
  const activityScheduled = event.activityTaskScheduledEventAttributes;
  if (activityScheduled) {
    const context: ActivitySerializationContext = {
      type: 'activity',
      namespace: workflowContext.namespace,
      workflowId: workflowContext.workflowId,
      activityId: activityScheduled.activityId || undefined,
      isLocal: false,
    };
    activities.set(event.eventId!.toString(), context);
    return context;
  }

  const activityRelated =
    event.activityTaskStartedEventAttributes ??
    event.activityTaskCompletedEventAttributes ??
    event.activityTaskFailedEventAttributes ??
    event.activityTaskTimedOutEventAttributes ??
    event.activityTaskCanceledEventAttributes;
  if (activityRelated) {
    const context = activities.get(activityRelated.scheduledEventId?.toString() ?? '');
    if (!context) throw new Error(`Missing scheduled activity for event ${event.eventId}`);
    return context;
  }

  const childStarted = event.startChildWorkflowExecutionInitiatedEventAttributes;
  const childRelated =
    event.childWorkflowExecutionCompletedEventAttributes ??
    event.childWorkflowExecutionFailedEventAttributes ??
    event.childWorkflowExecutionCanceledEventAttributes;
  const externalSignaled = event.signalExternalWorkflowExecutionInitiatedEventAttributes;
  if (childStarted || childRelated || externalSignaled) {
    const workflowId =
      childStarted?.workflowId ??
      childRelated?.workflowExecution?.workflowId ??
      externalSignaled?.workflowExecution?.workflowId;
    if (!workflowId) throw new Error(`Missing target Workflow ID for event ${event.eventId}`);
    return {
      type: 'workflow',
      namespace: (childStarted ?? childRelated ?? externalSignaled)?.namespace || workflowContext.namespace,
      workflowId,
    };
  }

  return workflowContext;
}
