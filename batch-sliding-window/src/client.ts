import { Client, Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { processBatchWorkflow } from './workflows';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  const workflowId = `batch-sliding-window-${Date.now()}`;

  console.log(`Starting workflow ${workflowId}`);

  const result = await client.workflow.execute(processBatchWorkflow, {
    taskQueue: 'batch-sliding-window',
    workflowId,
    args: [{ pageSize: 5, slidingWindowSize: 10, partitions: 3 }],
  });

  console.log(`Workflow completed. Total records processed: ${result}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
