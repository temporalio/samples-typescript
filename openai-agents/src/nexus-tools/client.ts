import { Connection, Client } from '@temporalio/client';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import { OpenAIProvider } from '@openai/agents-openai';
import { nexusToolWorkflow, WEATHER_ENDPOINT } from './workflows';
import { nanoid } from 'nanoid';

const TASK_QUEUE = 'openai-agents-nexus-tools';

async function ensureEndpoint(connection: Connection): Promise<void> {
  try {
    await connection.operatorService.createNexusEndpoint({
      spec: {
        name: WEATHER_ENDPOINT,
        target: { worker: { namespace: 'default', taskQueue: TASK_QUEUE } },
      },
    });
  } catch (err) {
    if (!String((err as { message?: string }).message).includes('already')) {
      throw err;
    }
  }
}

async function run() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const connection = await Connection.connect();
  await ensureEndpoint(connection);

  const client = new Client({
    connection,
    plugins: [new OpenAIAgentsPlugin({ modelProvider: new OpenAIProvider({ apiKey }) })],
  });

  const prompt = process.argv[2] ?? 'What is the weather in Tokyo?';
  const handle = await client.workflow.start(nexusToolWorkflow, {
    taskQueue: TASK_QUEUE,
    workflowId: 'openai-agents-nexus-' + nanoid(),
    args: [prompt],
  });

  console.log(`Started workflow ${handle.workflowId}`);
  console.log(await handle.result());
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
