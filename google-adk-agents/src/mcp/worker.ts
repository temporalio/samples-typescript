import * as path from 'path';
import { NativeConnection, Worker } from '@temporalio/worker';
import { GoogleAdkPlugin } from '@temporalio/google-adk-agents';

async function run() {
  const exposedDir = path.resolve(__dirname, 'sample-files');

  const connection = await NativeConnection.connect({ address: 'localhost:7233' });
  try {
    const worker = await Worker.create({
      connection,
      taskQueue: 'google-adk-mcp',
      workflowsPath: require.resolve('./workflows'),
      plugins: [
        new GoogleAdkPlugin({
          mcpToolsets: {
            filesystem: () => ({
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
