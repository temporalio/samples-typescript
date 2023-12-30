// @@@SNIPSTART typescript-hello-client
import { Connection, Client } from '@temporalio/client';
import { chatRoomWorkflow } from './workflows';

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

  const handle = await client.workflow.start(chatRoomWorkflow, {
    taskQueue: 'sse-task-queue',
    args: [{ roomId: 'default' }],
    workflowId: 'room:default',
  });

  console.log(`Started workflow ${handle.workflowId}`);
  await handle.result();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND
