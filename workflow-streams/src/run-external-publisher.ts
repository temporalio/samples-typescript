/**
 * External publisher: a non-Activity process pushes events into a workflow.
 *
 * The two earlier scenarios publish from inside the workflow itself
 * (`order`, `pipeline`) or from an Activity it runs (`chargeCard`). This
 * scenario shows the third shape: a backend service, scheduled job, or
 * anything else with a Temporal `Client` publishing into a *running* workflow
 * it didn't start. Same factory as the subscribe path —
 * `WorkflowStreamClient.create` — used for publishing instead.
 *
 * The script starts a `hub` workflow (which does no work of its own — it
 * exists only to host the stream), then runs a publisher and a subscriber
 * concurrently. When the publisher is done it signals `close`, the workflow's
 * run finishes, and the subscriber's iterator exits normally.
 */
import { Client, Connection } from '@temporalio/client';
import { WorkflowStreamClient } from '@temporalio/workflow-streams/client';
import { nanoid } from 'nanoid';
import { TASK_QUEUE, TOPIC_NEWS, type NewsEvent } from './shared';
import { closeSignal, hub } from './workflows';

const HEADLINES = ['rates held', 'merger announced', 'outage resolved', 'earnings beat', 'regulator opens probe'];

// In-band terminator the publisher emits before signaling close. The
// subscriber recognizes this value and stops polling — without an explicit
// terminator the consumer would have to rely on the workflow returning to
// break the iterator, which means racing the last item delivery against
// workflow completion.
const DONE_HEADLINE = '__done__';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const connection = await Connection.connect({ address: 'localhost:7233' });
  const client = new Client({ connection });

  const workflowId = `workflow-stream-hub-${nanoid(8)}`;
  const handle = await client.workflow.start(hub, {
    args: [{ hubId: workflowId }],
    taskQueue: TASK_QUEUE,
    workflowId,
  });

  async function publishNews(): Promise<void> {
    // `WorkflowStreamClient.create` takes a Temporal client and a workflow id
    // — the same factory used elsewhere for subscribing. `await using`
    // batches publishes and flushes on scope exit; we additionally call
    // `flush()` before signaling close so we know the events landed before
    // the workflow shuts down.
    await using producer = WorkflowStreamClient.create(client, workflowId);
    const news = producer.topic<NewsEvent>(TOPIC_NEWS);
    for (const headline of HEADLINES) {
      news.publish({ headline });
      console.log(`[publisher] sent: ${headline}`);
      await sleep(500);
    }
    news.publish({ headline: DONE_HEADLINE }, { forceFlush: true });
    await producer.flush();
    // Tell the hub it can stop. The subscriber has already broken out of its
    // for-await loop on the sentinel above.
    await handle.signal(closeSignal);
    console.log('[publisher] signaled close');
  }

  async function consumeNews(): Promise<void> {
    const consumer = WorkflowStreamClient.create(client, workflowId);
    for await (const item of consumer.topic<NewsEvent>(TOPIC_NEWS).subscribe(0)) {
      if (item.data.headline === DONE_HEADLINE) return;
      console.log(`[subscriber] offset=${item.offset}: ${item.data.headline}`);
    }
  }

  await Promise.all([publishNews(), consumeNews()]);

  const result = await handle.result();
  console.log(`\nworkflow result: ${result}`);
  await connection.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
