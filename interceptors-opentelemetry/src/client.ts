import { randomUUID } from 'crypto';
import { OpenTelemetryWorkflowClientInterceptor } from '@temporalio/interceptors-opentelemetry';
import { Connection, Client } from '@temporalio/client';
import { example } from './workflows';

async function run() {
  // Connect to localhost with default ConnectionOptions,
  // pass options to the Connection constructor to configure TLS and other settings.
  const connection = await Connection.connect();

  // Attach the OpenTelemetryClientCallsInterceptor to the client.
  const client = new Client({
    connection,

    // Registers OpenTelemetry Tracing interceptor for Client calls
    interceptors: {
      workflow: [new OpenTelemetryWorkflowClientInterceptor()],
    },
  });

  const result = await client.workflow.execute(example, {
    taskQueue: 'interceptors-opentelemetry-example',
    workflowId: randomUUID(),
    args: ['Temporal'],
  });
  console.log(result); // Hello, Temporal!
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
