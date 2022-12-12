import { Client } from '@temporalio/client';
import { expense, approveSignal } from '../workflows';

async function run() {
  const client = new Client();

  const expenseId = 'my-business-id';
  const handle = await client.workflow.start(expense, {
    taskQueue: 'expense',
    workflowId: expenseId,
    args: [expenseId],
  });

  // At a "later time" send signal for approval
  await new Promise((resolve) => setTimeout(resolve, 50));
  await handle.signal(approveSignal);

  console.log('Done:', await handle.result()); // Done: { status: 'COMPLETED' }
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});
