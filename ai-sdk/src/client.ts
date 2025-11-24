import { Connection, Client } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { haikuAgent, mcpAgent, middlewareAgent, telemetryAgent, toolsAgent } from './workflows';
import { nanoid } from 'nanoid';

async function run() {
  const args = process.argv;
  const workflow = args[2] ?? "haiku";
  console.log(`Running ${workflow}`);

  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  let handle;
  switch (workflow) {
    case "middleware":
      handle = await client.workflow.start(middlewareAgent, {
        taskQueue: 'ai-sdk',
        args: ['Middleware'],
        workflowId: 'workflow-' + nanoid(),
      });
      break;
    case "mcp":
      handle = await client.workflow.start(mcpAgent, {
        taskQueue: 'ai-sdk',
        args: ['Tell me about lickitung.'],
        workflowId: 'workflow-' + nanoid(),
      });
      break;
    case "tools":
      handle = await client.workflow.start(toolsAgent, {
        taskQueue: 'ai-sdk',
        args: ['What is the weather in Tokyo?'],
        workflowId: 'workflow-' + nanoid(),
      });
      break;
    default:
      handle = await client.workflow.start(haikuAgent, {
        taskQueue: 'ai-sdk',
        args: ['Temporal'],
        workflowId: 'workflow-' + nanoid(),
      });
  }
  console.log(`Started workflow ${handle.workflowId}`);

  // optional: wait for client result
  console.log(await handle.result()); // Hello, Temporal!
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
