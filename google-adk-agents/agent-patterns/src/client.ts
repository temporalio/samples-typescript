import { Connection, Client } from '@temporalio/client';
import { GoogleAdkPlugin } from '@temporalio/google-adk-agents';
import { nanoid } from 'nanoid';
import { multiAgent } from './workflows';

async function run() {
  const connection = await Connection.connect();
  const client = new Client({ connection, plugins: [new GoogleAdkPlugin()] });

  const result = await client.workflow.execute(multiAgent, {
    taskQueue: 'google-adk-agent-patterns',
    workflowId: 'google-adk-agent-patterns-' + nanoid(),
    args: ['durable execution'],
  });

  console.log(result);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
