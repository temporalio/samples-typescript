import { nanoid } from 'nanoid';
import { Connection, Client } from '@temporalio/client';
import { echoCallerWorkflow, helloCallerWorkflow } from './caller/workflows';

async function run() {
  const namespace = 'my-caller-namespace';
  const callerTaskQueue = 'nexus-hello-caller-task-queue';

  const connection = await Connection.connect({ address: 'localhost:7233' });
  const client = new Client({
    connection,
    namespace,
  });

  const echoMessage = await client.workflow.execute(echoCallerWorkflow, {
    taskQueue: callerTaskQueue,
    args: ['This message is from the client'],
    workflowId: 'workflow-' + nanoid(),
  });
  console.log(`Echo message: ${echoMessage}`);

  const helloMessage = await client.workflow.execute(helloCallerWorkflow, {
    taskQueue: callerTaskQueue,
    args: ['Temporal', 'en'],
    workflowId: 'workflow-' + nanoid(),
  });
  console.log(`Hello message: ${helloMessage}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND
