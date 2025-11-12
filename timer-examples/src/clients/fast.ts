import { Client, Connection } from '@temporalio/client';
import { processOrderWorkflow } from '../workflows';
import { loadClientConnectConfig } from '@temporalio/envconfig';

async function run(): Promise<void> {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  // Does *not* send email to `process.env.ADMIN_EMAIL` that order processing is slow
  const result = await client.workflow.execute(processOrderWorkflow, {
    taskQueue: 'timer-examples',
    workflowId: 'process-order-fast',
    args: [{ orderProcessingMS: 100, sendDelayedEmailTimeoutMS: 1000 }],
  });
  console.log(result);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
