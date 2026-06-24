import { Connection, Client } from '@temporalio/client';
import { GoogleAdkPlugin } from '@temporalio/google-adk-agents';
import { nanoid } from 'nanoid';
import { filesystemAgent } from './workflows';

async function run() {
  const connection = await Connection.connect();
  const client = new Client({ connection, plugins: [new GoogleAdkPlugin()] });

  const result = await client.workflow.execute(filesystemAgent, {
    taskQueue: 'google-adk-mcp',
    workflowId: 'google-adk-mcp-' + nanoid(),
    args: ['List the files you can access, then summarize what is in hello.txt.'],
  });

  console.log(result);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
