// @@@SNIPSTART typescript-openai-agents-sandbox-worker
import { NativeConnection, Worker } from '@temporalio/worker';
import { OpenAIAgentsPlugin, SandboxClientProvider } from '@temporalio/openai-agents';
import { OpenAIProvider } from '@openai/agents-openai';
import { UnixLocalSandboxClient } from '@openai/agents-core/sandbox/local';

async function run() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  if (!process.env.SANDBOX_SERVICE_TOKEN) {
    throw new Error('SANDBOX_SERVICE_TOKEN environment variable is required');
  }

  const connection = await NativeConnection.connect({ address: 'localhost:7233' });
  try {
    const worker = await Worker.create({
      connection,
      taskQueue: 'openai-agents-sandboxes',
      workflowsPath: require.resolve('./workflows'),
      plugins: [
        new OpenAIAgentsPlugin({
          modelProvider: new OpenAIProvider({ apiKey }),
          sandboxClientProviders: [new SandboxClientProvider('local', new UnixLocalSandboxClient())],
          resolvableWorkerEnvVars: ['SANDBOX_SERVICE_TOKEN'],
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
// @@@SNIPEND

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
