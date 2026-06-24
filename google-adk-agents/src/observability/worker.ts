import { Resource } from '@opentelemetry/resources';
import { NativeConnection, Worker } from '@temporalio/worker';
import { GoogleAdkPlugin } from '@temporalio/google-adk-agents';
import { OpenTelemetryPlugin } from '@temporalio/interceptors-opentelemetry';
import { AdkUsageSpanProcessor } from './adk-usage-span-processor';

async function run() {
  const spanProcessor = new AdkUsageSpanProcessor((call) =>
    console.log(
      `call_llm ${call.model}: ${call.inputTokens} in + ${call.outputTokens} out = ` +
        `${call.inputTokens + call.outputTokens} tokens in ${call.durationMs.toFixed(0)}ms`,
    ),
  );

  const connection = await NativeConnection.connect({ address: 'localhost:7233' });
  try {
    const worker = await Worker.create({
      connection,
      taskQueue: 'google-adk-observability',
      workflowsPath: require.resolve('./workflows'),
      plugins: [
        new OpenTelemetryPlugin({
          resource: new Resource({ 'service.name': 'google-adk-observability' }),
          spanProcessor,
        }),
        new GoogleAdkPlugin(),
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
