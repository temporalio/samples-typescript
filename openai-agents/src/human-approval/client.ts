import { Connection, Client } from '@temporalio/client';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import { OpenAIProvider } from '@openai/agents-openai';
import { approvalWorkflow } from './workflows';
import { nanoid } from 'nanoid';

async function run() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const scenario = process.argv[2] ?? 'human-approval';
  console.log(`Running scenario: ${scenario}`);

  const connection = await Connection.connect();
  const client = new Client({
    connection,
    plugins: [new OpenAIAgentsPlugin({ modelProvider: new OpenAIProvider({ apiKey }) })],
  });

  const taskQueue = 'openai-agents-human-approval';
  const workflowId = 'openai-agents-' + nanoid();

  const handle = await client.workflow.start(approvalWorkflow, {
    taskQueue,
    workflowId,
    args: [{}],
  });

  console.log(`Started workflow ${handle.workflowId}`);
  console.log('Sending approval signal...');
  await handle.signal('approve');
  console.log(await handle.result());
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
