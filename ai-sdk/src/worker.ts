import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';
import { AiSdkPlugin } from '@temporalio/ai-sdk';
import { openai } from '@ai-sdk/openai';
import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function run() {
  const connection = await NativeConnection.connect({
    address: 'localhost:7233',
  });
  try {
    // This is only used by the MCP Sample
    // @@@SNIPSTART typescript-vercel-ai-sdk-mcp-client-factories
    const mcpClientFactories = {
      testServer: () =>
        createMCPClient({
          transport: new StdioClientTransport({
            command: 'node',
            args: ['lib/mcp-server.js'],
          }),
        }),
    };
    // @@@SNIPEND

    // @@@SNIPSTART typescript-vercel-ai-sdk-worker-create
    const worker = await Worker.create({
      plugins: [
        new AiSdkPlugin({
          modelProvider: openai,
          mcpClientFactories,
        }),
      ],
      connection,
      namespace: 'default',
      taskQueue: 'ai-sdk',
      // Workflows are registered using a path as they run in a separate JS context.
      workflowsPath: require.resolve('./workflows'),
      activities,
    });
    // @@@SNIPEND

    await worker.run();
  } finally {
    // Close the connection once the worker has stopped
    await connection.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
