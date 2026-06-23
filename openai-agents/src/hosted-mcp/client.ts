import { Connection, Client } from '@temporalio/client';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import { OpenAIProvider } from '@openai/agents-openai';
import { simple, approval, approvalDecision } from './workflows';
import { nanoid } from 'nanoid';

async function run() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const scenario = process.argv[2] ?? 'simple';
  console.log(`Running scenario: ${scenario}`);

  const connection = await Connection.connect();
  const client = new Client({
    connection,
    plugins: [new OpenAIAgentsPlugin({ modelProvider: new OpenAIProvider({ apiKey }) })],
  });

  const taskQueue = 'openai-agents-hosted-mcp';
  const workflowId = 'openai-agents-' + nanoid();

  let handle;
  switch (scenario) {
    case 'simple':
      handle = await client.workflow.start(simple, {
        taskQueue,
        workflowId,
        args: ['What does the openai/codex project do? Use the hosted MCP tools to find out.'],
      });
      break;
    case 'approval':
      handle = await client.workflow.start(approval, {
        taskQueue,
        workflowId,
        args: ['What does the openai/codex project do? Use the hosted MCP tools to find out.'],
      });
      await handle.signal(approvalDecision, true);
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
