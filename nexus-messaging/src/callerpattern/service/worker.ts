import { Worker, NativeConnection } from '@temporalio/worker';
import { Connection, Client, WorkflowExecutionAlreadyStartedError } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { nexusGreetingServiceHandler } from './handler';
import { createActivities } from './activities';
import { greetingWorkflow } from './workflows';
import { HANDLER_NAMESPACE, HANDLER_TASK_QUEUE } from '../api';

function workflowIdForUser(userId: string): string {
  return `GreetingWorkflow_for_${userId}`;
}

async function run() {
  const config = loadClientConnectConfig();

  // Start entity workflows for known users before starting the worker
  const clientConnection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection: clientConnection, namespace: HANDLER_NAMESPACE });

  const userIds = ['user-1', 'user-2'];
  for (const userId of userIds) {
    try {
      await client.workflow.start(greetingWorkflow, {
        taskQueue: HANDLER_TASK_QUEUE,
        workflowId: workflowIdForUser(userId),
      });
      console.log(`Started GreetingWorkflow for user: ${userId}`);
    } catch (err) {
      if (err instanceof WorkflowExecutionAlreadyStartedError) {
        console.log(`GreetingWorkflow for user ${userId} already running`);
      } else {
        throw err;
      }
    }
  }
  await clientConnection.close();

  const connection = await NativeConnection.connect(config.connectionOptions);
  try {
    const worker = await Worker.create({
      connection,
      namespace: HANDLER_NAMESPACE,
      taskQueue: HANDLER_TASK_QUEUE,
      workflowsPath: require.resolve('./workflows'),
      activities: createActivities(),
      nexusServices: [nexusGreetingServiceHandler as any],
    });

    await worker.run();
  } finally {
    await connection.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
