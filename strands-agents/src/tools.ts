import { Client, Connection } from '@temporalio/client';
import { toolsWorkflow } from './workflows';

async function run() {
  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233',
  });
  const client = new Client({ connection });

  const result = await client.workflow.execute(toolsWorkflow, {
    args: [
      [
        'Please do two things:',
        "1. Count the letter R's in 'strawberry'.",
        '2. Fetch the weather in San Francisco.',
      ].join('\n'),
    ],
    taskQueue: 'strands-agents',
    workflowId: 'strands-tools',
  });
  console.log(`Result: ${result}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
