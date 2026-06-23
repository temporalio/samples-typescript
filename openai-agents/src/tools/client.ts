import { Connection, Client } from '@temporalio/client';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import { OpenAIProvider } from '@openai/agents-openai';
import { webSearch, imageGeneration, codeInterpreter } from './workflows';
import { nanoid } from 'nanoid';

async function run() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const scenario = process.argv[2] ?? 'web-search';
  console.log(`Running scenario: ${scenario}`);

  const connection = await Connection.connect();
  const client = new Client({
    connection,
    plugins: [new OpenAIAgentsPlugin({ modelProvider: new OpenAIProvider({ apiKey }) })],
  });

  const taskQueue = 'openai-agents-tools';
  const workflowId = 'openai-agents-' + nanoid();

  let handle;
  switch (scenario) {
    case 'web-search':
      handle = await client.workflow.start(webSearch, {
        taskQueue,
        workflowId,
        args: ['What is a notable recent development in durable execution?'],
      });
      break;
    case 'image-generation':
      handle = await client.workflow.start(imageGeneration, {
        taskQueue,
        workflowId,
        args: ['Generate an image of a robot orchestrating workflows.'],
      });
      break;
    case 'code-interpreter':
      handle = await client.workflow.start(codeInterpreter, {
        taskQueue,
        workflowId,
        args: ['What is the 20th Fibonacci number? Compute it.'],
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
