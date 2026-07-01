import { Connection, Client } from '@temporalio/client';
import { GoogleAdkPlugin } from '@temporalio/google-adk-agents';
import { nanoid } from 'nanoid';
import { weatherAgent } from './workflows';

async function run() {
  const connection = await Connection.connect();
  const client = new Client({ connection, plugins: [new GoogleAdkPlugin()] });

  const result = await client.workflow.execute(weatherAgent, {
    taskQueue: 'google-adk-tools',
    workflowId: 'google-adk-tools-' + nanoid(),
    args: ['What is the weather in Tokyo?'],
  });

  console.log(result);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
