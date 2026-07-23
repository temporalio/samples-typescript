import { Connection, Client } from '@temporalio/client';
import { GoogleAdkPlugin } from '@temporalio/google-adk-agents';
import { nanoid } from 'nanoid';
import { streamingModelCall } from './workflows';

async function run() {
  const connection = await Connection.connect();
  const client = new Client({ connection, plugins: [new GoogleAdkPlugin()] });

  const result = await client.workflow.execute(streamingModelCall, {
    taskQueue: 'google-adk-streaming',
    workflowId: 'google-adk-streaming-' + nanoid(),
    args: ['Tell me a short story about a robot learning to paint.'],
  });

  console.log(`Received ${result.chunks} chunk(s):`);
  console.log(result.text);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
