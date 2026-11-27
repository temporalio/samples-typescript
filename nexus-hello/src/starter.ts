import { nanoid } from 'nanoid';
import { Connection, Client } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { echoCallerWorkflow, helloCallerWorkflow } from './caller/workflows';

async function run() {
  const namespace = 'my-caller-namespace';
  const callerTaskQueue = 'nexus-hello-caller-task-queue';

  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({
    connection,
    namespace,
  });

  const echoMessage = await client.workflow.execute(echoCallerWorkflow, {
    taskQueue: callerTaskQueue,
    args: [{ message: 'This message is from the client' }],
    workflowId: 'workflow-' + nanoid(),
  });
  console.log(`Echo message: ${echoMessage.message}`);

  const helloMessage = await client.workflow.execute(helloCallerWorkflow, {
    taskQueue: callerTaskQueue,
    args: [{ name: 'Temporal', language: 'en' }],
    workflowId: 'workflow-' + nanoid(),
  });
  console.log(`Hello message: ${helloMessage.message}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
