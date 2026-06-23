import { Client, Connection } from '@temporalio/client';
import { defaultPayloadConverter } from '@temporalio/common';
import { WorkflowStreamClient } from '@temporalio/workflow-streams/client';
import { nanoid } from 'nanoid';
import { TASK_QUEUE, TOPIC_PROGRESS, TOPIC_STATUS, type ProgressEvent, type StatusEvent } from './shared';
import { order } from './workflows';

async function run() {
  const connection = await Connection.connect({ address: 'localhost:7233' });
  const client = new Client({ connection });

  const workflowId = `workflow-stream-order-${nanoid(8)}`;
  const handle = await client.workflow.start(order, {
    args: [{ orderId: 'order-1' }],
    taskQueue: TASK_QUEUE,
    workflowId,
  });

  const stream = WorkflowStreamClient.create(client, workflowId);

  // Single iterator over both topics — avoids a cancellation race between two
  // concurrent subscribers. Without `resultType`, `item.data` is the
  // underlying `Payload`, which we decode at the call site so we can dispatch
  // heterogeneous events on `item.topic`. The loop ends either on the in-band
  // `complete` terminator (break) or because the iterator exhausts when the
  // workflow reaches a terminal state without one (e.g. on failure). Either
  // way we then await `handle.result()`, which raises if the workflow failed.
  for await (const item of stream.subscribe([TOPIC_STATUS, TOPIC_PROGRESS])) {
    if (item.topic === TOPIC_STATUS) {
      const evt = defaultPayloadConverter.fromPayload<StatusEvent>(item.data);
      console.log(`[status] ${evt.kind}: order=${evt.orderId}`);
      if (evt.kind === 'complete') break;
    } else if (item.topic === TOPIC_PROGRESS) {
      const evt = defaultPayloadConverter.fromPayload<ProgressEvent>(item.data);
      console.log(`[progress] ${evt.message}`);
    }
  }

  const result = await handle.result();
  console.log(`workflow result: ${result}`);
  await connection.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
