import { Client, Connection } from '@temporalio/client';
import { chatEnd, chatTurn, chatWorkflow } from './workflows';

async function run() {
  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233',
  });
  const client = new Client({ connection });

  const handle = await client.workflow.start(chatWorkflow, {
    taskQueue: 'strands-agents',
    workflowId: 'strands-continue-as-new',
  });

  for (const prompt of ['Hi! What is durable execution?', 'Give me a one-sentence summary.']) {
    const reply = await handle.executeUpdate(chatTurn, { args: [prompt] });
    console.log(`user: ${prompt}`);
    console.log(`assistant: ${reply}\n`);
  }

  await handle.signal(chatEnd);
  await handle.result();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
