import { Connection, Client } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { fileProcessingWorkflow } from './workflows';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });
  await client.workflow.execute(fileProcessingWorkflow, {
    taskQueue: 'normal-task-queue',
    workflowId: 'file-processing-0',
  });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
