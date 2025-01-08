import { Connection, Client } from '@temporalio/client';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OpenTelemetryWorkflowClientInterceptor } from '@temporalio/interceptors-opentelemetry';
import { example } from './workflows';

async function run() {
  // Connect to localhost with default ConnectionOptions,
  // pass options to the Connection constructor to configure TLS and other settings.
  const connection = await Connection.connect();
  // Attach the OpenTelemetryClientCallsInterceptor to the client.
  const client = new Client({
    connection,
    interceptors: {
      workflow: [new OpenTelemetryWorkflowClientInterceptor()],
    },
  });
  try {
    const result = await client.workflow.execute(example, {
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
