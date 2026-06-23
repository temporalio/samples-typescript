import { Connection, Client } from '@temporalio/client';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import { OpenAIProvider } from '@openai/agents-openai';
import { agentHandoffs, handoffFunction, handoffWithFilter } from './workflows';
import { nanoid } from 'nanoid';

async function run() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const scenario = process.argv[2] ?? 'agent-handoffs';
  console.log(`Running scenario: ${scenario}`);

  const connection = await Connection.connect();
  const client = new Client({
    connection,
    plugins: [new OpenAIAgentsPlugin({ modelProvider: new OpenAIProvider({ apiKey }) })],
  });

  const taskQueue = 'openai-agents-handoffs';
  const workflowId = 'openai-agents-' + nanoid();

  let handle;
  switch (scenario) {
    case 'agent-handoffs':
      handle = await client.workflow.start(agentHandoffs, {
        taskQueue,
        workflowId,
        args: ['I have a billing question about my invoice.'],
      });
      break;
    case 'handoff-function':
      handle = await client.workflow.start(handoffFunction, {
        taskQueue,
        workflowId,
        args: ['I need help with a support issue.'],
      });
      break;
    case 'handoff-with-filter':
      handle = await client.workflow.start(handoffWithFilter, {
        taskQueue,
        workflowId,
        args: ['I have a billing question about my invoice.'],
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
