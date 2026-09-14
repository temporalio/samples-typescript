import { Connection, Client } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { nanoid } from 'nanoid';
import { promptBatch } from './workflows';
import { DEFAULT_MODEL, TASK_QUEUE } from './shared';

const DEFAULT_PROMPTS = ['Explain retries in one sentence.', 'Write a haiku about databases.'];

async function run() {
  // Usage: npm run workflow -- [--fail-once] [--model <slug>] [prompt ...]
  const args = process.argv.slice(2);
  const failOnceAfterCall = args.includes('--fail-once');
  const modelIndex = args.indexOf('--model');
  const model = modelIndex >= 0 ? args[modelIndex + 1] : DEFAULT_MODEL;
  const prompts = args.filter((a, i) => !a.startsWith('--') && (modelIndex < 0 || i !== modelIndex + 1));

  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  const workflowId = 'openrouter-prompt-batch-' + nanoid();
  console.log(`Starting ${workflowId}`);
  const result = await client.workflow.execute(promptBatch, {
    taskQueue: TASK_QUEUE,
    workflowId,
    args: [{ prompts: prompts.length ? prompts : DEFAULT_PROMPTS, model, failOnceAfterCall }],
  });

  for (const r of result.results) {
    console.log(`\n[${r.model}] $${r.costUsd.toFixed(6)} cache=${r.cacheStatus || '-'}`);
    console.log(`  Q: ${r.prompt}`);
    console.log(`  A: ${r.answer.trim()}`);
  }
  for (const s of result.skipped) {
    console.log(`\n[skipped: ${s.reason}] ${s.prompt}`);
  }
  console.log(`\nTotal cost: $${result.totalCostUsd.toFixed(6)}`);
  console.log(`Inspect: temporal workflow show -w ${workflowId}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
