/**
 * Reconnecting subscriber: read a few events, disconnect, resume.
 *
 * Demonstrates the central Workflow Streams use case: a consumer can
 * disappear mid-stream — page refresh, server restart, laptop closed — and
 * resume later without missing events or seeing duplicates. The event log
 * lives in the Workflow, so the consumer just remembers where it stopped.
 *
 * The script runs the pattern in two phases inside one process to keep the
 * demo short. The same code shape works across actual process restarts
 * because the resume offset is durable in the workflow, not in the consumer.
 *
 * Output is one line per emit, with current stream stats in a left column and
 * a phase / event message in a right column. A background poller calls
 * `WorkflowStreamClient.getOffset()` for the whole demo and emits a heartbeat
 * line once a second so you can watch `pend` (`available - processed`) grow
 * while the consumer is disconnected and shrink as phase 2 catches up.
 */
import { Client, Connection } from '@temporalio/client';
import { WorkflowStreamClient } from '@temporalio/workflow-streams/client';
import { nanoid } from 'nanoid';
import { TASK_QUEUE, TOPIC_STATUS, type StageEvent } from './shared';
import { pipeline } from './workflows';

// Number of events read in phase 1 before simulating a disconnect. Picked
// small enough that the workflow is still running after.
const PHASE_1_EVENTS = 2;

// How long to stay disconnected.
const DISCONNECT_MS = 3000;

// Background poller cadence. The poller refreshes `available` this often and
// emits a heartbeat line once per HEARTBEAT_MS.
const POLL_INTERVAL_MS = 250;
const HEARTBEAT_MS = 1000;

// Width of the stats column. Picked to fit the longest stats string.
const LEFT_WIDTH = 30;

interface State {
  processed: number;
  available: number;
}

const pending = (s: State): number => Math.max(0, s.available - s.processed);

function emit(state: State, message: string): void {
  const left = `proc=${String(state.processed).padStart(2)}  avail=${String(state.available).padStart(2)}  pend=${String(pending(state)).padStart(2)}`;
  console.log(`${left.padEnd(LEFT_WIDTH)}│ ${message}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const connection = await Connection.connect({ address: 'localhost:7233' });
  const client = new Client({ connection });

  const workflowId = `workflow-stream-pipeline-${nanoid(8)}`;
  const handle = await client.workflow.start(pipeline, {
    args: [{ pipelineId: workflowId }],
    taskQueue: TASK_QUEUE,
    workflowId,
  });

  // In a production web backend the resume offset would live in durable
  // storage keyed by (user_id, run_id) — a database row, a Redis key, etc.
  // For an in-process demo a `state.processed` field works the same way.
  const state: State = { processed: 0, available: 0 };
  const stream = WorkflowStreamClient.create(client, workflowId);
  emit(state, `started ${workflowId}`);

  let stopped = false;
  const pollerDone = (async () => {
    let lastEmit = Date.now();
    while (!stopped) {
      try {
        state.available = await stream.getOffset();
      } catch {
        // ignore
      }
      const now = Date.now();
      if (now - lastEmit >= HEARTBEAT_MS) {
        emit(state, '·');
        lastEmit = now;
      }
      await sleep(POLL_INTERVAL_MS);
    }
  })();

  try {
    // ---- Phase 1: connect, read a couple of events, "disconnect".
    emit(state, '[phase 1] connecting');
    let seen = 0;
    for await (const item of stream.topic<StageEvent>(TOPIC_STATUS).subscribe(0)) {
      // Remember *one past* the offset just consumed: on resume we want the
      // next unseen event, not the one we already showed.
      state.processed = item.offset + 1;
      emit(state, `  offset=${String(item.offset).padStart(2)}  stage=${item.data.stage}`);
      seen += 1;
      if (seen >= PHASE_1_EVENTS) break;
    }
    emit(state, '[phase 1] disconnecting');

    // ---- Disconnect window: nobody reads. The workflow keeps publishing —
    // `pend` grows on the heartbeat lines as the offset advances past
    // `processed`.
    await sleep(DISCONNECT_MS);

    // ---- Phase 2: brand-new client + stream, resume from saved offset.
    // Same shape as a different process picking up where the first one left
    // off.
    emit(state, '[phase 2] reconnecting');
    const connection2 = await Connection.connect({ address: 'localhost:7233' });
    const client2 = new Client({ connection: connection2 });
    const stream2 = WorkflowStreamClient.create(client2, workflowId);
    try {
      for await (const item of stream2.topic<StageEvent>(TOPIC_STATUS).subscribe(state.processed)) {
        state.processed = item.offset + 1;
        emit(state, `  offset=${String(item.offset).padStart(2)}  stage=${item.data.stage}`);
        if (item.data.stage === 'complete') break;
      }
    } finally {
      await connection2.close();
    }

    const result = await handle.result();
    emit(state, `workflow result: ${result}`);
  } finally {
    stopped = true;
    await pollerDone;
    await connection.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
