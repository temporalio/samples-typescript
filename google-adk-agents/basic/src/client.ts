import { Connection, Client } from '@temporalio/client';
import { GoogleAdkPlugin } from '@temporalio/google-adk-agents';
import { nanoid } from 'nanoid';
import { helloWorld } from './workflows';

async function run() {
  const connection = await Connection.connect();
  const client = new Client({ connection, plugins: [new GoogleAdkPlugin()] });

  const result = await client.workflow.execute(helloWorld, {
    taskQueue: 'google-adk-basic',
    workflowId: 'google-adk-basic-' + nanoid(),
    args: ['Write a haiku about durable execution.'],
  });

  console.log(result);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
