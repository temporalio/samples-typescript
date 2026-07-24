import { Client, Connection } from '@temporalio/client';
import { hooksWorkflow } from './workflows';

async function run() {
  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233',
  });
  const client = new Client({ connection });

  const fired = await client.workflow.execute(hooksWorkflow, {
    args: ["Echo 'hello' once."],
    taskQueue: 'strands-agents',
    workflowId: 'strands-hooks',
  });
  console.log(`Tools that fired AfterToolCallEvent: ${JSON.stringify(fired)}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
