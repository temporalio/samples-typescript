import { Client, Connection } from '@temporalio/client';
import { helloWorld } from './workflows';

async function run() {
  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233',
  });
  const client = new Client({ connection });

  const result = await client.workflow.execute(helloWorld, {
    args: ['Write a haiku about durable execution.'],
    taskQueue: 'strands-agents',
    workflowId: 'strands-hello-world',
  });
  console.log(`Result: ${result}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
