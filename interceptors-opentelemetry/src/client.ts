import { randomUUID } from 'crypto';
import { OpenTelemetryPlugin } from '@temporalio/interceptors-opentelemetry';
import { Connection, Client } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { example } from './workflows';
import { resource, spanProcessor } from './instrumentation';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);

  // The OpenTelemetryPlugin automatically registers tracing interceptors for Client calls.
  const plugins = spanProcessor ? [new OpenTelemetryPlugin({ resource, spanProcessor })] : [];

  const client = new Client({
    connection,
    plugins,
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
