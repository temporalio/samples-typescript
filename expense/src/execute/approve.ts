import { WorkflowClient } from '@temporalio/client';
import { expense, approveSignal } from '../workflows';
import { v4 as uuid4 } from 'uuid';

async function run() {
  const client = new WorkflowClient();

  const expenseId = uuid4();
  const handle = await client.start(expense, {
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
