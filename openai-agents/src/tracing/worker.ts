import { NativeConnection, Worker } from '@temporalio/worker';
import { OpenAIAgentsPlugin } from '@temporalio/openai-agents';
import { OpenAIProvider } from '@openai/agents-openai';
import { OpenAITracingExporter } from '@openai/agents-openai';
import { addTraceProcessor, BatchTraceProcessor } from '@openai/agents-core';
import { trace } from '@opentelemetry/api';
import { createTracerProvider } from '@temporalio/openai-agents/otel';
import { RecordingTracingProcessor } from './recording-processor';

type TracingMode = 'openai' | 'custom' | 'otel';

async function run() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  const mode = (process.argv[2] ?? process.env.TRACING_MODE ?? 'custom') as TracingMode;
  console.log(`Tracing mode: ${mode}`);

  let useOtelInstrumentation = false;
  switch (mode) {
    case 'openai':
      addTraceProcessor(new BatchTraceProcessor(new OpenAITracingExporter()));
      break;
    case 'custom':
      addTraceProcessor(new RecordingTracingProcessor());
      break;
    case 'otel':
      trace.setGlobalTracerProvider(createTracerProvider());
      useOtelInstrumentation = true;
      break;
    default:
      throw new Error(`Unknown tracing mode: ${mode}`);
  }

  const connection = await NativeConnection.connect({ address: 'localhost:7233' });
  try {
    const worker = await Worker.create({
      connection,
      taskQueue: 'openai-agents-tracing',
      workflowsPath: require.resolve('./workflows'),
      plugins: [
        new OpenAIAgentsPlugin({
          modelProvider: new OpenAIProvider({ apiKey }),
          modelParams: { useLocalActivity: true },
          interceptorOptions: { useOtelInstrumentation, addTemporalSpans: true },
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
