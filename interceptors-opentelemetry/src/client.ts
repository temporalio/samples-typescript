import { Connection, WorkflowClient } from '@temporalio/client';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OpenTelemetryWorkflowClientCallsInterceptor } from '@temporalio/interceptors-opentelemetry/lib/client';
import { example } from './workflows';

async function run() {
  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'interceptors-sample-client',
  });
  // Export spans to console for simplicity
  const exporter = new ConsoleSpanExporter();

  const otel = new NodeSDK({ traceExporter: exporter, resource });
  await otel.start();
  // Connect to localhost with default ConnectionOptions,
  // pass options to the Connection constructor to configure TLS and other settings.
  const connection = new Connection({});
  // Attach the OpenTelemetryWorkflowClientCallsInterceptor to the client.
  const client = new WorkflowClient(connection.service, {
    interceptors: {
      calls: [() => new OpenTelemetryWorkflowClientCallsInterceptor()],
    },
  });
  try {
    const result = await client.execute(example, {
      taskQueue: 'interceptors-opentelemetry-example',
      workflowId: 'otel-example-0',
      args: ['Temporal'],
    });
    console.log(result); // Hello, Temporal!
  } finally {
    await otel.shutdown();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
