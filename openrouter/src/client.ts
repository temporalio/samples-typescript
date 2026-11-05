import { Connection, Client } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { nanoid } from 'nanoid';
import { promptBatch } from './workflows';
import { DEFAULT_MODEL, TASK_QUEUE } from './shared';

const DEFAULT_PROMPTS = ['Explain retries in one sentence.', 'Write a haiku about databases.'];

async function run() {
  // Usage: npm run workflow -- [--fail-once] [--model <slug>] [--max-concurrency <n>] [prompt ...]
  const args = process.argv.slice(2);
  let failOnceAfterCall = false;
  let model = DEFAULT_MODEL;
  let maxConcurrency = 5;
  const prompts: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--fail-once') failOnceAfterCall = true;
    else if (arg === '--model' || arg === '--max-concurrency') {
      const value = args[++i];
      if (value === undefined || value.startsWith('--')) throw new Error(`${arg} requires a value`);
      if (arg === '--model') model = value;
      else {
        maxConcurrency = Number(value);
        if (!Number.isInteger(maxConcurrency) || maxConcurrency < 1) {
          throw new Error('--max-concurrency must be a positive integer');
        }
      }
    } else if (arg.startsWith('--')) throw new Error(`Unknown flag: ${arg}`);
    else prompts.push(arg);
  }

  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection, namespace: config.namespace ?? 'default' });

  const workflowId = 'openrouter-prompt-batch-' + nanoid();
  console.log(`Starting ${workflowId}`);
  const result = await client.workflow.execute(promptBatch, {
    taskQueue: TASK_QUEUE,
    workflowId,
    args: [{ prompts: prompts.length ? prompts : DEFAULT_PROMPTS, model, maxConcurrency, failOnceAfterCall }],
  });

  for (const r of result.results) {
    const cost = r.costUsd === null ? 'unknown' : `$${r.costUsd.toFixed(6)}`;
    console.log(`\n[${r.model}] ${cost} cache=${r.cacheStatus || '-'}`);
    console.log(`  Q: ${r.prompt}`);
    console.log(`  A: ${r.answer.trim()}`);
  }
  for (const s of result.skipped) {
    console.log(`\n[skipped: ${s.reason}] ${s.prompt}`);
  }
  console.log(
    `\nReported cost: $${result.reportedCostUsd.toFixed(6)} (what OpenRouter reported on each prompt's final attempt)`,
  );
  if (result.unknownCostCount > 0) {
    console.log(`  ${result.unknownCostCount} prompt(s) came back without a cost`);
  }
  console.log(`Inspect: temporal workflow show -w ${workflowId}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
