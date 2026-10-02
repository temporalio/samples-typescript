import { nanoid } from 'nanoid';
import { Connection, Client } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { callerWorkflow } from './caller/workflows';
import { CALLER_NAMESPACE } from './api';

const CALLER_TASK_QUEUE = 'nexus-messaging-caller-task-queue';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({
    connection,
    namespace: CALLER_NAMESPACE,
  });

  const userId = 'user-1';
  const result = await client.workflow.execute(callerWorkflow, {
    taskQueue: CALLER_TASK_QUEUE,
    args: [userId],
    workflowId: 'callerpattern-' + nanoid(),
  });

  console.log('Caller workflow result:');
  for (const entry of result) {
    console.log(' ', entry);
  }

  await connection.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
