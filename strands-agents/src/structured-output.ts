import { Client, Connection } from '@temporalio/client';
import { StrandsPlugin } from '@temporalio/strands-agents';
import { structuredOutputWorkflow } from './workflows';

async function run() {
  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233',
  });
  const client = new Client({ connection, plugins: [new StrandsPlugin()] });

  const person = await client.workflow.execute(structuredOutputWorkflow, {
    args: ['John Smith is a 30 year-old software engineer.'],
    taskQueue: 'strands-agents',
    workflowId: 'strands-structured-output',
  });
  console.log(`name=${person.name} age=${person.age} occupation=${person.occupation}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
