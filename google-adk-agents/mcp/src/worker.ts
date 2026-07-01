import { NativeConnection, Worker } from '@temporalio/worker';
import { GoogleAdkPlugin } from '@temporalio/google-adk-agents';
import { filesystemToolset } from './toolsets';

async function run() {
  const connection = await NativeConnection.connect({ address: 'localhost:7233' });
  try {
    const worker = await Worker.create({
      connection,
      taskQueue: 'google-adk-mcp',
      workflowsPath: require.resolve('./workflows'),
      plugins: [new GoogleAdkPlugin({ mcpToolsets: { filesystem: filesystemToolset() } })],
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
