import { Connection, Client } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { WorkflowStreamClient } from '@temporalio/workflow-streams/client';
import {
  haikuAgent,
  mcpAgent,
  middlewareAgent,
  streamingAgent,
  streamObjectAgent,
  toolsAgent,
  STREAM_TOPIC,
  OBJECT_STREAM_TOPIC,
} from './workflows';
import { nanoid } from 'nanoid';

// @@@SNIPSTART typescript-vercel-ai-sdk-streaming-consumer
// Subscribe to a Workflow's stream topic and render each text delta live as it
// is published by the streaming activity. Each item's payload is the
// JSON-encoded AI SDK stream part; `resultType: true` decodes it to raw bytes.
async function renderStream(client: Client, workflowId: string, topic: string): Promise<void> {
  const streamClient = WorkflowStreamClient.create(client, workflowId);
  for await (const item of streamClient.subscribe<Uint8Array>(topic, 0, { resultType: true })) {
    const part = JSON.parse(new TextDecoder().decode(item.data));
    if (part.type === 'text-delta') process.stdout.write(part.delta);
    if (part.type === 'finish') break;
  }
  process.stdout.write('\n');
}
// @@@SNIPEND

async function run() {
  const args = process.argv;
  const workflow = args[2] ?? 'haiku';
  console.log(`Running ${workflow}`);

  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  let handle;
  switch (workflow) {
    case 'stream': {
      const streamHandle = await client.workflow.start(streamingAgent, {
        taskQueue: 'ai-sdk',
        args: ['Temporal'],
        workflowId: 'workflow-' + nanoid(),
      });
      console.log(`Started workflow ${streamHandle.workflowId}`);
      await renderStream(client, streamHandle.workflowId, STREAM_TOPIC);
      console.log(await streamHandle.result());
      await connection.close();
      return;
    }
    case 'stream-object': {
      const streamHandle = await client.workflow.start(streamObjectAgent, {
        taskQueue: 'ai-sdk',
        args: ['Generate a lasagna recipe.'],
        workflowId: 'workflow-' + nanoid(),
      });
      console.log(`Started workflow ${streamHandle.workflowId}`);
      await renderStream(client, streamHandle.workflowId, OBJECT_STREAM_TOPIC);
      console.log(await streamHandle.result());
      await connection.close();
      return;
    }
    case 'middleware':
      handle = await client.workflow.start(middlewareAgent, {
        taskQueue: 'ai-sdk',
        args: ['Middleware'],
        workflowId: 'workflow-' + nanoid(),
      });
      break;
    case 'mcp':
      handle = await client.workflow.start(mcpAgent, {
        taskQueue: 'ai-sdk',
        args: ['Tell me about lickitung.'],
        workflowId: 'workflow-' + nanoid(),
      });
      break;
    case 'tools':
      handle = await client.workflow.start(toolsAgent, {
        taskQueue: 'ai-sdk',
        args: ['What is the weather in Tokyo?'],
        workflowId: 'workflow-' + nanoid(),
      });
      break;
    case 'haiku':
      handle = await client.workflow.start(haikuAgent, {
        taskQueue: 'ai-sdk',
        args: ['Temporal'],
        workflowId: 'workflow-' + nanoid(),
      });
      break;
    default:
      throw new Error('Unknown workflow type: ' + workflow);
  }
  console.log(`Started workflow ${handle.workflowId}`);

  // optional: wait for workflow result
  console.log(await handle.result()); // Hello, Temporal!
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
