import { Connection, Client } from '@temporalio/client';
import { nanoid } from 'nanoid';
import { observedAgent } from './workflows';

async function run() {
  const connection = await Connection.connect();
  const client = new Client({ connection });

  const result = await client.workflow.execute(observedAgent, {
    taskQueue: 'google-adk-observability',
    workflowId: 'google-adk-observability-' + nanoid(),
    args: [['Write a haiku about durable execution.', 'Write a haiku about workflow replay.']],
  });

  console.log(result.join('\n'));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
