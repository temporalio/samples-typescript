import * as path from 'path';
import { NativeConnection, Worker } from '@temporalio/worker';
import { GoogleAdkPlugin } from '@temporalio/google-adk-agents';
import { mockMCPToolset } from '@temporalio/google-adk-agents/testing';
import { Type } from '@google/genai';
import { offlineModelProvider } from './offline-model';

async function run() {
  const exposedDir = path.resolve(__dirname, 'sample-files');
  const offline = process.env.MODEL_PROVIDER === 'fake';

  const connection = await NativeConnection.connect({ address: 'localhost:7233' });
  try {
    const worker = await Worker.create({
      connection,
      taskQueue: 'google-adk-mcp',
      workflowsPath: require.resolve('./workflows'),
      plugins: [
        new GoogleAdkPlugin({
          ...(offline ? { modelProvider: offlineModelProvider() } : {}),
          mcpToolsets: {
            filesystem: offline
              ? mockMCPToolset([
                  {
                    declaration: {
                      name: 'read_file',
                      description: 'Read a file.',
                      parameters: { type: Type.OBJECT, properties: { path: { type: Type.STRING } } },
                    },
                    handler: ({ path: file }) => ({
                      contents: file === 'hello.txt' ? 'Hello from the Temporal Google ADK sample.' : 'File not found.',
                    }),
                  },
                ])
              : () => ({
                  type: 'StdioConnectionParams',
                  serverParams: {
                    command: 'npx',
                    args: ['-y', '@modelcontextprotocol/server-filesystem', exposedDir],
                  },
                }),
          },
        }),
      ],
    });
    await worker.run();
  } finally {
    await connection.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
