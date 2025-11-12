import { randomUUID } from 'crypto';
import { OpenTelemetryWorkflowClientInterceptor } from '@temporalio/interceptors-opentelemetry';
import { Connection, Client } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { example } from './workflows';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);

  // Attach the OpenTelemetryWorkflowClientInterceptor to the client.
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
