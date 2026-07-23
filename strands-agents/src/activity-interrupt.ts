import { Client, Connection } from '@temporalio/client';
import { StrandsPlugin } from '@temporalio/strands-agents';
import {
  activityInterrupt,
  activityInterruptApproveSignal,
  activityInterruptPendingApprovalQuery,
} from './workflows';

async function run() {
  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233',
  });
  // The starter goes through the plugin's failure converter so an Interrupt
  // payload deserializes cleanly if it propagates to the client.
  const client = new Client({ connection, plugins: [new StrandsPlugin()] });

  const handle = await client.workflow.start(activityInterrupt, {
    args: ["Please delete the 'system' user."],
    taskQueue: 'strands-agents',
    workflowId: 'strands-activity-interrupt',
  });

  let reason: string | null = null;
  while (reason === null) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    reason = await handle.query(activityInterruptPendingApprovalQuery);
  }
  console.log(`Approval requested: ${reason}`);

  await handle.signal(activityInterruptApproveSignal, 'approve');

  const result = await handle.result();
  console.log(`Result: ${result}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
