import type { LlmResponse } from '@google/adk';
import { NativeConnection, Worker } from '@temporalio/worker';
import { GoogleAdkPlugin } from '@temporalio/google-adk-agents';
import { fakeModelProvider } from '@temporalio/google-adk-agents/testing';

async function run() {
  const offline: LlmResponse[] = [
    {
      content: {
        role: 'model',
        parts: [
          { text: JSON.stringify({ title: 'Database latency', severity: 'high', actions: ['Inspect slow queries'] }) },
        ],
      },
      turnComplete: true,
    },
  ];
  const connection = await NativeConnection.connect({ address: 'localhost:7233' });
  try {
    const worker = await Worker.create({
      connection,
      taskQueue: 'google-adk-structured-output',
      workflowsPath: require.resolve('./workflows'),
      plugins: [
        new GoogleAdkPlugin(process.env.MODEL_PROVIDER === 'fake' ? { modelProvider: fakeModelProvider(offline) } : {}),
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
