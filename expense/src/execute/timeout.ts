import { Connection, WorkflowClient } from '@temporalio/client';
import { expense } from '../workflows';
import { v4 as uuid4 } from 'uuid';

async function run() {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);

  const expenseId = uuid4();
  const result = await client.execute(expense, { taskQueue: 'tutorial', args: [expenseId, '1s'] });

  // Prints "Done: { status: 'TIMED_OUT' }" after approximately 1 second
  console.log('Done:', result);
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});
