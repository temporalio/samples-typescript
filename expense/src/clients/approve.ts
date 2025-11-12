import { Client, Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { expense, approveSignal } from '../workflows';
import { setTimeout } from 'timers/promises';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  const expenseId = 'my-business-id';
  const handle = await client.workflow.start(expense, {
    taskQueue: 'expense',
    workflowId: expenseId,
    args: [expenseId],
  });

  // At a "later time" send signal for approval
  await setTimeout(50);
  await handle.signal(approveSignal);

  console.log('Done:', await handle.result()); // Done: { status: 'COMPLETED' }
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});
