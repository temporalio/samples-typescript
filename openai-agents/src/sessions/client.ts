import { Connection, Client } from '@temporalio/client';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import { OpenAIProvider } from '@openai/agents-openai';
import { multiTurnChat, carryoverChat } from './workflows';
import { nanoid } from 'nanoid';

async function run() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const scenario = process.argv[2] ?? 'multi-turn-chat';
  console.log(`Running scenario: ${scenario}`);

  const connection = await Connection.connect();
  const client = new Client({
    connection,
    plugins: [new OpenAIAgentsPlugin({ modelProvider: new OpenAIProvider({ apiKey }) })],
  });

  const taskQueue = 'openai-agents-sessions';
  const workflowId = 'openai-agents-sessions-' + nanoid();

  let handle;
  switch (scenario) {
    case 'multi-turn-chat':
      handle = await client.workflow.start(multiTurnChat, {
        taskQueue,
        workflowId,
        args: [['What is the capital of France?', 'And what is it known for?']],
      });
      break;
    case 'carryover-chat':
      handle = await client.workflow.start(carryoverChat, {
        taskQueue,
        workflowId,
        args: [{ prompts: ['What is the capital of France?', 'And what is it known for?', 'What is the population?'] }],
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
