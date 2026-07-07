import { Connection, Client } from '@temporalio/client';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import { OpenAIProvider } from '@openai/agents-openai';
import { WorkflowStreamClient } from '@temporalio/workflow-streams/client';
import { streamingChat, streamingTopic } from './workflows';
import { nanoid } from 'nanoid';

interface ModelStreamEvent {
  type?: string;
  delta?: string;
}

async function run() {
  const connection = await Connection.connect();
  const client = new Client({
    connection,
    plugins: [
      new OpenAIAgentsPlugin({
        // The client never calls the model (it runs in the Worker's Activity); this only satisfies the plugin's required modelProvider field.
        modelProvider: new OpenAIProvider({}),
        modelParams: { streamingTopic, streamingBatchInterval: '200 milliseconds' },
      }),
    ],
  });

  const taskQueue = 'openai-agents-streaming';
  const workflowId = 'openai-agents-streaming-' + nanoid();

  const handle = await client.workflow.start(streamingChat, {
    taskQueue,
    workflowId,
    args: ['Write a short poem about durable execution.'],
  });
  console.log(`Started workflow ${handle.workflowId}`);

  const streamClient = WorkflowStreamClient.create(client, workflowId);
  const subscriber = (async () => {
    for await (const item of streamClient.topic<ModelStreamEvent>(streamingTopic).subscribe()) {
      if (item.data.type === 'output_text_delta' && item.data.delta) {
        process.stdout.write(item.data.delta);
      }
    }
  })();

  const result = await handle.result();
  await subscriber;
  console.log('\n---');
  console.log(result);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
