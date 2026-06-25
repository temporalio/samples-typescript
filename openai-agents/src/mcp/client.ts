import { Connection, Client } from '@temporalio/client';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import { OpenAIProvider } from '@openai/agents-openai';
import { filesystem, streamableHttp, sse, promptServer, statefulMemory } from './workflows';
import { nanoid } from 'nanoid';

async function run() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const scenario = process.argv[2] ?? 'filesystem';
  console.log(`Running scenario: ${scenario}`);

  const connection = await Connection.connect();
  const client = new Client({
    connection,
    plugins: [new OpenAIAgentsPlugin({ modelProvider: new OpenAIProvider({ apiKey }) })],
  });

  const taskQueue = 'openai-agents-mcp';
  const workflowId = 'openai-agents-mcp-' + nanoid();

  let handle;
  switch (scenario) {
    case 'filesystem':
      handle = await client.workflow.start(filesystem, {
        taskQueue,
        workflowId,
        args: ['List the files in the sample-files directory.'],
      });
      break;
    case 'streamable-http':
      handle = await client.workflow.start(streamableHttp, {
        taskQueue,
        workflowId,
        args: ['What is 17 plus 25?'],
      });
      break;
    case 'sse':
      handle = await client.workflow.start(sse, {
        taskQueue,
        workflowId,
        args: ['What is the weather in London?'],
      });
      break;
    case 'prompt-server':
      handle = await client.workflow.start(promptServer, {
        taskQueue,
        workflowId,
        args: ['Temporal is a durable execution platform for building reliable distributed systems.'],
      });
      break;
    case 'stateful-memory':
      handle = await client.workflow.start(statefulMemory, {
        taskQueue,
        workflowId,
        args: ['Save a note titled "greeting" with body "Hello, world!". Then list all notes.'],
      });
      break;
    default:
      throw new Error(`Unknown scenario: ${scenario}`);
  }

  console.log(`Started workflow ${handle.workflowId}`);
  console.log(await handle.result());
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
