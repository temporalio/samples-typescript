import { Connection, Client } from '@temporalio/client';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import { OpenAIProvider } from '@openai/agents-openai';
import {
  helloWorld,
  tools,
  inlineTool,
  localActivityTool,
  agentContext,
  structuredOutput,
  modelOverride,
  dynamicInstructions,
} from './workflows';
import { nanoid } from 'nanoid';

async function run() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const scenario = process.argv[2] ?? 'hello-world';
  console.log(`Running scenario: ${scenario}`);

  const connection = await Connection.connect();
  const client = new Client({
    connection,
    plugins: [new OpenAIAgentsPlugin({ modelProvider: new OpenAIProvider({ apiKey }) })],
  });

  const taskQueue = 'openai-agents-basic';
  const workflowId = 'openai-agents-' + nanoid();

  let handle;
  switch (scenario) {
    case 'hello-world':
      handle = await client.workflow.start(helloWorld, { taskQueue, workflowId, args: ['Say hello in one sentence.'] });
      break;
    case 'tools':
      handle = await client.workflow.start(tools, { taskQueue, workflowId, args: ['What is the weather in Tokyo?'] });
      break;
    case 'inline-tool':
      handle = await client.workflow.start(inlineTool, { taskQueue, workflowId, args: ['What is 42 plus 58?'] });
      break;
    case 'local-activity-tool':
      handle = await client.workflow.start(localActivityTool, {
        taskQueue,
        workflowId,
        args: ['Get headlines about AI.'],
      });
      break;
    case 'agent-context':
      handle = await client.workflow.start(agentContext, { taskQueue, workflowId, args: ['Who am I?'] });
      break;
    case 'structured-output':
      handle = await client.workflow.start(structuredOutput, {
        taskQueue,
        workflowId,
        args: ['Temporal is a durable execution platform for building reliable distributed systems.'],
      });
      break;
    case 'model-override':
      handle = await client.workflow.start(modelOverride, {
        taskQueue,
        workflowId,
        args: ['Briefly explain what Temporal is.'],
      });
      break;
    case 'dynamic-instructions':
      handle = await client.workflow.start(dynamicInstructions, { taskQueue, workflowId, args: ['Hello!'] });
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
