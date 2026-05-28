import path from 'node:path';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { McpClient } from '@strands-agents/sdk';
import { StrandsPlugin } from '@temporalio/strands-agents';
import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';

const ECHO_SERVER = path.join(__dirname, 'mcp-server.ts');

function makeEchoClient(): McpClient {
  return new McpClient({
    transport: new StdioClientTransport({
      command: 'npx',
      args: ['ts-node', ECHO_SERVER],
    }),
  });
}

async function run() {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233',
  });
  try {
    const worker = await Worker.create({
      connection,
      taskQueue: 'strands-agents',
      workflowsPath: require.resolve('./workflows'),
      activities,
      // Omit `models:` so the plugin registers its default `BedrockModel` under
      // the name `bedrock`. To use a different provider or pin a model ID,
      // pass e.g. `models: { bedrock: () => new BedrockModel({ modelId: '...' }) }`.
      plugins: [new StrandsPlugin({ mcpClients: { echo: makeEchoClient } })],
    });
    console.log('Worker started. Ctrl+C to exit.');
    await worker.run();
  } finally {
    await connection.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
