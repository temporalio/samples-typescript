import { Connection, Client } from '@temporalio/client';
import { GoogleAdkPlugin } from '@temporalio/google-adk-agents';
import { nanoid } from 'nanoid';
import { humanApproval, approveSignal } from './workflows';

async function run() {
  const connection = await Connection.connect();
  const client = new Client({ connection, plugins: [new GoogleAdkPlugin()] });

  const handle = await client.workflow.start(humanApproval, {
    taskQueue: 'google-adk-human-approval',
    workflowId: 'google-adk-human-approval-' + nanoid(),
  });
  console.log(`Started workflow ${handle.workflowId}; sending approval Signal.`);

  await handle.signal(approveSignal, 'approved-by-operator');
  console.log(await handle.result());
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
