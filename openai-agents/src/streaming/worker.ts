import { NativeConnection, Worker } from '@temporalio/worker';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import { OpenAIProvider } from '@openai/agents-openai';

async function run() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const connection = await NativeConnection.connect({ address: 'localhost:7233' });
  try {
    const worker = await Worker.create({
      connection,
      taskQueue: 'openai-agents-streaming',
      workflowsPath: require.resolve('./workflows'),
      plugins: [
        new OpenAIAgentsPlugin({
          modelProvider: new OpenAIProvider({ apiKey }),
        }),
      ],
      bundlerOptions: {
        webpackConfigHook: (config) => ({
          ...config,
          resolve: {
            ...config.resolve,
            conditionNames: ['require', 'browser', 'default'],
          },
        }),
      },
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
