import { Client, Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import crypto from 'node:crypto';
import wait from 'waait';
import { humanVerificationWorkflow, verifySignal } from './workflows';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  const handle = await client.workflow.start(humanVerificationWorkflow, {
    args: ['4 + 20 = 420'],
    taskQueue: 'replay-demo',
    workflowId: 'workflow-' + crypto.randomUUID(),
  });
  console.log(`Started workflow ${handle.workflowId}`);

  await wait(1000);
  await handle.signal(verifySignal);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
