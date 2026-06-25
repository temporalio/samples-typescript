import { condition, defineSignal, proxyActivities, setHandler, sleep } from '@temporalio/workflow';
import { WorkflowStream } from '@temporalio/workflow-streams/workflow';
import type * as activities from './activities';
import {
  TICKER_DEFAULTS,
  TOPIC_PROGRESS,
  TOPIC_STATUS,
  TOPIC_TICK,
  type HubInput,
  type OrderInput,
  type PipelineInput,
  type ProgressEvent,
  type StageEvent,
  type StatusEvent,
  type TickerInput,
  type TickEvent,
} from './shared';

const { chargeCard } = proxyActivities<typeof activities>({
  startToCloseTimeout: '30 seconds',
});

/**
 * Process a fake order, publishing status and progress events.
 *
 * The workflow itself publishes status changes; an activity it runs publishes
 * finer-grained progress events using a `WorkflowStreamClient`. A single
 * stream carries both topics — subscribers can filter on the topic(s) they
 * care about.
 *
 * Construct the stream as the first statement of the workflow function so the
 * publish/poll/offset handlers are registered before the workflow accepts any
 * messages. Threading `streamState` lets the workflow survive continue-as-new
 * without losing buffered items.
 */
export async function order(input: OrderInput): Promise<string> {
  const stream = new WorkflowStream(input.streamState);
  const status = stream.topic<StatusEvent>(TOPIC_STATUS);
  const progress = stream.topic<ProgressEvent>(TOPIC_PROGRESS);

  status.publish({ kind: 'received', orderId: input.orderId });

  const chargeId = await chargeCard(input.orderId);

  status.publish({ kind: 'shipped', orderId: input.orderId });
  progress.publish({ message: `charge id: ${chargeId}` });
  status.publish({ kind: 'complete', orderId: input.orderId });
  // The "complete" status event above is the in-band terminator subscribers
  // break on (see run-publisher.ts). Hold the run open briefly so subscribers'
  // next poll delivers it before this task returns and the in-memory log is
  // gone.
  await sleep('500 milliseconds');
  return chargeId;
}

/**
 * Multi-stage pipeline that publishes stage transitions over time.
 *
 * Stages are spaced out with `sleep` so a subscriber can realistically
 * disconnect partway through and reconnect without the pipeline finishing in
 * the meantime — the shape needed to demo the "show up late and still see
 * what happened" pattern.
 */
export async function pipeline(input: PipelineInput): Promise<string> {
  const stream = new WorkflowStream(input.streamState);
  const status = stream.topic<StageEvent>(TOPIC_STATUS);

  const stages = ['validating', 'loading data', 'transforming', 'writing output', 'verifying', 'complete'];
  for (const stage of stages) {
    status.publish({ stage });
    if (stage !== 'complete') {
      await sleep('2 seconds');
    }
  }
  // The "complete" stage above is the in-band terminator subscribers break
  // on. Hold the run open briefly so the final poll delivers it.
  await sleep('500 milliseconds');
  return `pipeline ${input.pipelineId} done`;
}

export const closeSignal = defineSignal('close');

/**
 * Passive stream host: starts up, waits, closes when told.
 *
 * Unlike `order` or `pipeline`, this workflow does no work of its own — it
 * exists only to host a `WorkflowStream` that external publishers push events
 * into and external subscribers read from. The shape that fits a backend
 * service or "event bus" pattern, where the workflow owns durable state but
 * the events come from outside.
 */
export async function hub(input: HubInput): Promise<string> {
  new WorkflowStream(input.streamState);
  let closed = false;
  setHandler(closeSignal, () => {
    closed = true;
  });
  await condition(() => closed);
  // The publisher publishes its own terminator into the stream before
  // signaling close (see run-external-publisher.ts). Hold the run open
  // briefly so subscribers' final poll delivers any items still in the log.
  await sleep('500 milliseconds');
  return `hub ${input.hubId} closed`;
}

/**
 * Long-running ticker that bounds its event log via `truncate`.
 *
 * Long-running workflows that publish high volumes of events would otherwise
 * grow their event log unboundedly. This workflow shows the truncation
 * pattern: every `truncateEvery` events, drop everything except the last
 * `keepLast` entries by calling `stream.truncate(safeOffset)`.
 *
 * Subscribers that fall behind a truncation jump forward to the new base
 * offset transparently (the iterator handles the `TruncatedOffset` error
 * internally), so consumers stay live but may not see every intermediate
 * event. That is the trade: bounded log size in exchange for at-best-effort
 * delivery to slow consumers.
 *
 * To compute the truncation offset the workflow tracks its own published
 * count. `WorkflowStream` does not expose a workflow-side head-offset
 * accessor, but the running count plus the carried `base_offset` (in
 * continue-as-new chains) is sufficient.
 */
export async function ticker(input: TickerInput): Promise<string> {
  const count = input.count ?? TICKER_DEFAULTS.count;
  const keepLast = input.keepLast ?? TICKER_DEFAULTS.keepLast;
  const truncateEvery = input.truncateEvery ?? TICKER_DEFAULTS.truncateEvery;
  const intervalMs = input.intervalMs ?? TICKER_DEFAULTS.intervalMs;

  const stream = new WorkflowStream(input.streamState);
  const tick = stream.topic<TickEvent>(TOPIC_TICK);
  // Running count of events published by THIS run. To compute a global
  // offset, add the priorState's base_offset (omitted here — this sample
  // doesn't continue-as-new).
  let published = 0;

  for (let n = 0; n < count; n++) {
    tick.publish({ n });
    published += 1;
    await sleep(intervalMs);
    if (published % truncateEvery === 0 && published > keepLast) {
      // Drop everything except the last `keepLast` entries.
      stream.truncate(published - keepLast);
    }
  }
  // The final tick (n === count - 1) is the in-band terminator subscribers
  // break on. `keepLast` guarantees that final offset survives the last
  // truncation so even slow consumers eventually see it. Hold the run open
  // briefly so the final poll delivers it.
  await sleep('500 milliseconds');
  return `ticker emitted ${published} events`;
}
