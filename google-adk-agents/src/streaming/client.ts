import type { LlmResponse } from '@google/adk';
import { Connection, Client } from '@temporalio/client';
import { WorkflowStreamClient } from '@temporalio/workflow-streams/client';
import { nanoid } from 'nanoid';
import { consumerDoneSignal, streamingModelCall, streamingTopic } from './workflows';

async function run() {
  const connection = await Connection.connect();
  const client = new Client({ connection });

  const workflowId = 'google-adk-streaming-' + nanoid();
  const handle = await client.workflow.start(streamingModelCall, {
    taskQueue: 'google-adk-streaming',
    workflowId,
    args: ['Tell me a short story about a robot learning to paint.'],
  });
  console.log(`Started workflow ${handle.workflowId}`);

  const streamClient = WorkflowStreamClient.create(client, workflowId);
  for await (const item of streamClient.topic<LlmResponse>(streamingTopic).subscribe()) {
    if (item.data.partial !== true) break;
    for (const part of item.data.content?.parts ?? []) {
      if (part.text) process.stdout.write(part.text);
    }
  }
  await handle.signal(consumerDoneSignal);

  const result = await handle.result();
  console.log(`\n---\nReceived ${result.chunks} chunk(s).`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
