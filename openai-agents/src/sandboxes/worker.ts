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
      // @@@SNIPSTART typescript-openai-agents-sandboxes-worker-configuration
      plugins: [
        new OpenAIAgentsPlugin({
          modelProvider: new OpenAIProvider({ apiKey }),
          sandboxClientProviders: [new SandboxClientProvider('local', new UnixLocalSandboxClient())],
          resolvableWorkerEnvVars: ['SANDBOX_SERVICE_TOKEN'],
        }),
      ],
      // @@@SNIPEND
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
