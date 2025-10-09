import { Client } from '@temporalio/client';
import { eagerWorkflow } from './workflows';
import { nanoid } from 'nanoid';
import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from './activities';

async function run() {
  // Note that the client and worker share the same native connection and run in the same process.
  const sharedNativeConnection = await NativeConnection.connect({ address: 'localhost:7233' });

  const client = new Client({
    connection: sharedNativeConnection,
  });

  const worker = await Worker.create({
    connection: sharedNativeConnection,
    namespace: 'default',
    taskQueue: 'eager-workflow-start',
    workflowsPath: require.resolve('./workflows'),
    activities,
  });

  await worker.runUntil(async () => {
    const handle = await client.workflow.start(eagerWorkflow, {
      taskQueue: 'eager-workflow-start',
      args: ['Temporal'],
      workflowId: 'workflow-' + nanoid(),
      requestEagerStart: true,
    });

    console.log(`Started workflow ${handle.workflowId}`);
    console.log(`Workflow eagerly started: ${handle.eagerlyStarted}`);

    console.log(await handle.result());
  });

  await sharedNativeConnection.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
