// @@@SNIPSTART typescript-polling-infrequent
import { Connection, Client } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { greetingWorkflow } from './workflows';
import { nanoid } from 'nanoid';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  const handle = await client.workflow.start(greetingWorkflow, {
    taskQueue: 'infrequent-activity-polling-task-queue',
    workflowId: 'workflow-' + nanoid(),
    args: ["Temporal"],
  });
  console.log(`Started workflow ${handle.workflowId}`);

  console.log(await handle.result());
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
// @@@SNIPEND
