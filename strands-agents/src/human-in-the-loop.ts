import { Client, Connection } from '@temporalio/client';
import { hitlApproveSignal, hitlPendingApprovalQuery, humanInTheLoop } from './workflows';

async function run() {
  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233',
  });
  const client = new Client({ connection });

  const handle = await client.workflow.start(humanInTheLoop, {
    args: ['Please delete /tmp/sensitive.txt'],
    taskQueue: 'strands-agents',
    workflowId: 'strands-human-in-the-loop',
  });

  let reason: string | null = null;
  while (reason === null) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    reason = await handle.query(hitlPendingApprovalQuery);
  }
  console.log(`Approval requested: ${reason}`);

  await handle.signal(hitlApproveSignal, 'approve');

  const result = await handle.result();
  console.log(`Result: ${result}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
