import { Connection, Client } from '@temporalio/client';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import { OpenAIProvider } from '@openai/agents-openai';
import { customProvider } from './workflows';
import { nanoid } from 'nanoid';

async function run() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  const baseURL = process.env.OPENAI_BASE_URL;
  if (!baseURL) {
    throw new Error('OPENAI_BASE_URL environment variable is required (the OpenAI-compatible endpoint)');
  }
  const model = process.env.OPENAI_MODEL;

  const prompt = process.argv[2] ?? 'Say hello in one sentence.';

  const connection = await Connection.connect();
  const client = new Client({
    connection,
    plugins: [new OpenAIAgentsPlugin({ modelProvider: new OpenAIProvider({ apiKey, baseURL }) })],
  });

  const taskQueue = 'openai-agents-model-providers';
  const workflowId = 'openai-agents-' + nanoid();

  const handle = await client.workflow.start(customProvider, { taskQueue, workflowId, args: [prompt, model] });

  console.log(`Started workflow ${handle.workflowId}`);
  console.log(await handle.result());
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
