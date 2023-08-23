// @@@SNIPSTART typescript-hello-client
import { Connection, Client } from '@temporalio/client';
import { sseWorkflow } from './workflows';
import { nanoid } from 'nanoid';

async function run() {
  // Connect to the default Server location
  const connection = await Connection.connect({ address: 'localhost:7233' });
  // In production, pass options to configure TLS and other settings:
  // {
  //   address: 'foo.bar.tmprl.cloud',
  //   tls: {}
  // }

  const client = new Client({
    connection,
    // namespace: 'foo.bar', // connects to 'default' namespace if not specified
  });

  const handle = await client.workflow.start(sseWorkflow, {
    taskQueue: 'sse-task-queue',
    args: [{ event: { type: process.argv[2], data: { message: process.argv[3] } } }],
    workflowId: 'publish-event:' + nanoid(),
  });

  console.log(`Started workflow ${handle.workflowId}`);
  await handle.result();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND
