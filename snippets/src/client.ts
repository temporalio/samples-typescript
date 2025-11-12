import { Client, Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { example } from './workflows';
import { nanoid } from 'nanoid';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });
  const workflowId = 'workflow-' + nanoid();
  const taskQueue = 'snippets';

  // @@@SNIPSTART typescript-retry-workflow
  const handle = await client.workflow.start(example, {
    taskQueue,
    workflowId,
    retry: {
      maximumAttempts: 3,
    },
  });
  // @@@SNIPEND
  console.log(`Started workflow ${handle.workflowId}`);

  await handle.result();
  console.log('Completed successfully');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

async function _snippets() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });
  const workflowId = 'workflow-' + nanoid();
  const taskQueue = 'snippets';

  // @@@SNIPSTART typescript-task-timeout
  await client.workflow.start(example, {
    taskQueue,
    workflowId,
    workflowTaskTimeout: '1 minute',
  });
  // @@@SNIPEND

  // @@@SNIPSTART typescript-run-timeout
  await client.workflow.start(example, {
    taskQueue,
    workflowId,
    workflowRunTimeout: '1 minute',
  });
  // @@@SNIPEND

  // @@@SNIPSTART typescript-execution-timeout
  await client.workflow.start(example, {
    taskQueue,
    workflowId,
    workflowExecutionTimeout: '1 day',
  });
  // @@@SNIPEND
}
