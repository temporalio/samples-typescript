import { Client, Connection } from '@temporalio/client';
import { mcpWorkflow } from './workflows';

async function run() {
  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233',
  });
  const client = new Client({ connection });

  const result = await client.workflow.execute(mcpWorkflow, {
    args: ["Use the echo tool to echo the message 'hello from MCP'."],
    taskQueue: 'strands-agents',
    workflowId: 'strands-mcp',
  });
  console.log(`Result: ${result}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
