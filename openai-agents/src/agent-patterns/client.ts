import { Connection, Client } from '@temporalio/client';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import { OpenAIProvider } from '@openai/agents-openai';
import {
  deterministic,
  parallelization,
  llmAsJudge,
  agentsAsTools,
  inputGuardrail,
  outputGuardrail,
} from './workflows';
import { nanoid } from 'nanoid';

async function run() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const scenario = process.argv[2] ?? 'deterministic';
  console.log(`Running scenario: ${scenario}`);

  const connection = await Connection.connect();
  const client = new Client({
    connection,
    plugins: [new OpenAIAgentsPlugin({ modelProvider: new OpenAIProvider({ apiKey }) })],
  });

  const taskQueue = 'openai-agents-agent-patterns';
  const workflowId = 'openai-agents-' + nanoid();

  let handle;
  switch (scenario) {
    case 'deterministic':
      handle = await client.workflow.start(deterministic, {
        taskQueue,
        workflowId,
        args: ['Write a short piece about the importance of software testing.'],
      });
      break;
    case 'parallelization':
      handle = await client.workflow.start(parallelization, {
        taskQueue,
        workflowId,
        args: ['What is the most important skill for a software engineer?'],
      });
      break;
    case 'llm-as-judge':
      handle = await client.workflow.start(llmAsJudge, {
        taskQueue,
        workflowId,
        args: ['Explain what Temporal is in two sentences.'],
      });
      break;
    case 'agents-as-tools':
      handle = await client.workflow.start(agentsAsTools, {
        taskQueue,
        workflowId,
        args: ['What are the benefits of durable execution?'],
      });
      break;
    case 'input-guardrails':
      handle = await client.workflow.start(inputGuardrail, {
        taskQueue,
        workflowId,
        args: ['Tell me something interesting about Temporal.'],
      });
      break;
    case 'output-guardrails':
      handle = await client.workflow.start(outputGuardrail, {
        taskQueue,
        workflowId,
        args: ['Describe a safe software deployment strategy.'],
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
