import { NativeConnection, Worker } from '@temporalio/worker';
import { Client as LangSmithClient } from 'langsmith';
import { LangSmithPlugin } from '@temporalio/langsmith';
import * as activities from './activities';

async function run() {
  const connection = await NativeConnection.connect({ address: 'localhost:7233' });
  try {
    const langsmith = new LangSmithClient();
    const plugin = new LangSmithPlugin({ client: langsmith, addTemporalRuns: true });

    const worker = await Worker.create({
      connection,
      taskQueue: 'langsmith-activity-tracing',
      workflowsPath: require.resolve('./workflows'),
      activities,
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
