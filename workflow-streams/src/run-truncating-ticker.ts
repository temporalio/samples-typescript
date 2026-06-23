/**
 * Truncating ticker: bounded log + slow vs. fast subscribers.
 *
 * The `ticker` workflow publishes `count` events at a fixed interval, calling
 * `stream.truncate(...)` periodically to bound log growth. This script
 * subscribes twice — once fast, once slow — and prints them in two lanes so
 * the trade is visible at a glance:
 *
 * - **Fast lane** (left). Keeps up. Sees every published offset.
 * - **Slow lane** (right). Sleeps between iterations. When a truncation has
 *   dropped its position by the time it polls again, the iterator silently
 *   jumps forward to the new base offset; the slow lane prints a
 *   `↪ jumped N → M (K dropped)` marker for each gap and resumes at the new
 *   offset.
 *
 * `truncate()` is unilateral: the workflow does not know who is subscribed
 * and does not wait for them. The implicit alternative — never truncating —
 * keeps every event around forever, lets slow consumers eventually catch up
 * without losses, and pays for it in unbounded workflow history. The
 * truncation model is the opposite trade: bounded log, at-best-effort
 * delivery to slow consumers, no backpressure on the publisher. Pair it with
 * set-semantic events where each event carries enough state to make missing
 * the prior ones recoverable.
 */
import { Client, Connection } from '@temporalio/client';
import { WorkflowStreamClient } from '@temporalio/workflow-streams/client';
import { nanoid } from 'nanoid';
import { TASK_QUEUE, TOPIC_TICK, type TickEvent } from './shared';
import { ticker } from './workflows';

// Aggressive truncation so the log stays at most KEEP_LAST entries right
// after each truncation, which keeps the slow subscriber's per-poll batch
// tiny. Small batches + a slow per-event sleep mean the slow subscriber
// re-polls often, and most of those polls land after a truncation that has
// passed its position — so it sees several jumps during the run rather than
// one batched at the end.
const TICKER_COUNT = 30;
const INTERVAL_MS = 200;
const TRUNCATE_EVERY = 2;
const KEEP_LAST = 1;
const SLOW_SUBSCRIBER_DELAY_MS = 1500;

const LANE_WIDTH = 32;
const SEP = '│';

function emitFast(message: string): void {
  console.log(`${message.padEnd(LANE_WIDTH)} ${SEP}`);
}

function emitSlow(message: string): void {
  console.log(`${' '.repeat(LANE_WIDTH)} ${SEP} ${message}`);
}

function emitHeader(): void {
  const rule = '─'.repeat(LANE_WIDTH);
  console.log(
    `${'fast (every event)'.padEnd(LANE_WIDTH)} ${SEP} slow (sleeps ${SLOW_SUBSCRIBER_DELAY_MS / 1000}s between events)`,
  );
  console.log(`${rule} ${SEP} ${rule}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const connection = await Connection.connect({ address: 'localhost:7233' });
  const client = new Client({ connection });

  const workflowId = `workflow-stream-ticker-${nanoid(8)}`;
  const handle = await client.workflow.start(ticker, {
    args: [{ count: TICKER_COUNT, keepLast: KEEP_LAST, truncateEvery: TRUNCATE_EVERY, intervalMs: INTERVAL_MS }],
    taskQueue: TASK_QUEUE,
    workflowId,
  });
  const stream = WorkflowStreamClient.create(client, workflowId);
  const lastN = TICKER_COUNT - 1;

  emitHeader();

  async function fastSubscriber(): Promise<void> {
    for await (const item of stream.topic<TickEvent>(TOPIC_TICK).subscribe(0)) {
      emitFast(`offset=${String(item.offset).padStart(3)}  n=${item.data.n}`);
      if (item.data.n === lastN) return;
    }
  }

  async function slowSubscriber(): Promise<void> {
    let lastOffset = -1;
    for await (const item of stream.topic<TickEvent>(TOPIC_TICK).subscribe(0)) {
      if (lastOffset >= 0 && item.offset > lastOffset + 1) {
        const gap = item.offset - lastOffset - 1;
        emitSlow(`↪ jumped offset=${lastOffset} → ${item.offset} (${gap} dropped)`);
      }
      emitSlow(`offset=${String(item.offset).padStart(3)}  n=${item.data.n}`);
      lastOffset = item.offset;
      if (item.data.n === lastN) return;
      await sleep(SLOW_SUBSCRIBER_DELAY_MS);
    }
  }

  await Promise.all([fastSubscriber(), slowSubscriber()]);

  const result = await handle.result();
  console.log();
  console.log(`workflow result: ${result}`);
  await connection.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
