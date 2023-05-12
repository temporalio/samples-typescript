import { Client } from '@temporalio/client';
import { nanoid } from 'nanoid';
import wait from 'waait';
import { humanVerificationWorkflow, verifySignal } from './workflows';

async function run() {
  const client = new Client();

  const handle = await client.workflow.start(humanVerificationWorkflow, {
    args: ['4 + 20 = 420'],
    taskQueue: 'replay-demo',
    workflowId: 'workflow-' + nanoid(),
  });
  console.log(`Started workflow ${handle.workflowId}`);

  await wait(1000);
  await handle.signal(verifySignal);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
