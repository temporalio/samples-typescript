import { nanoid } from 'nanoid';
import { Connection, Client } from '@temporalio/client';
import { sampleWorkflow } from './workflows';
import { ContextClientInterceptor } from './context/temporal/client-interceptors';
import { NormalContext } from './context/context-type';

async function run() {
  const connection = await Connection.connect({
    address: 'localhost:7233',
    // If appropriate, configure TLS and other settings.
    // This is optional but we leave this here to remind you there is a gRPC connection being established.
  });

  const clientInterceptor = new ContextClientInterceptor();
  const client = new Client({
    connection,
    namespace: 'default',
    interceptors: { workflow: [clientInterceptor], schedule: [clientInterceptor] },
  });

  const ctx = new NormalContext('Acme Inc.');

  await client.workflow.execute(sampleWorkflow, {
    taskQueue: 'context-propagation',
    workflowId: 'workflow-' + nanoid(),
    args: [ctx],
  });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
