import { Connection, Client } from '@temporalio/client';
import { reasoningContent } from './workflows';
import { nanoid } from 'nanoid';

async function run() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const prompt = process.argv[2] ?? 'What is the square root of 841? Please explain your reasoning.';
  const model = process.env.OPENAI_MODEL ?? 'deepseek-reasoner';

  const connection = await Connection.connect();
  const client = new Client({ connection });

  const handle = await client.workflow.start(reasoningContent, {
    taskQueue: 'openai-agents-reasoning-content',
    workflowId: 'openai-agents-' + nanoid(),
    args: [prompt, model],
  });

  console.log(`Started workflow ${handle.workflowId}`);
  const result = await handle.result();
  console.log(`\nPrompt: ${result.prompt}`);
  console.log(`\nReasoning:\n${result.reasoningContent ?? 'No reasoning content provided'}`);
  console.log(`\nAnswer:\n${result.content ?? 'No content provided'}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
