import { Client } from '@temporalio/client';
import { expense } from '../workflows';

async function run() {
  const client = new Client();

  const expenseId = 'my-business-id';
  const result = await client.workflow.execute(expense, {
    taskQueue: 'expense',
    workflowId: expenseId,
    args: [expenseId, '1s'],
  });

  // Prints "Done: { status: 'TIMED_OUT' }" after approximately 1 second
  console.log('Done:', result);
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});
