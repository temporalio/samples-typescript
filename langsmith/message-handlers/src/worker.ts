import { NativeConnection, Worker } from '@temporalio/worker';
import { Client as LangSmithClient } from 'langsmith';
import { LangSmithPlugin } from '@temporalio/langsmith';

async function run() {
  const connection = await NativeConnection.connect({ address: 'localhost:7233' });
  try {
    const langsmith = new LangSmithClient();
    const plugin = new LangSmithPlugin({ client: langsmith, addTemporalRuns: true });

    const worker = await Worker.create({
      connection,
      taskQueue: 'langsmith-message-handlers',
      workflowsPath: require.resolve('./workflows'),
      plugins: [plugin],
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
