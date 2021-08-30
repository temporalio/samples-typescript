import { Connection, WorkflowClient } from '@temporalio/client';
import { Expense } from '../interfaces/workflows';
import { v4 } from 'uuid';

async function run() {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);
  const expense = client.stub<Expense>('expense', { taskQueue: 'tutorial20210830' });

  const expenseId = v4();

  await expense.start(expenseId);

  // Prints "Done: { status: 'TIMED_OUT' }" after approximately 10 seconds
  console.log('Done:', await expense.result());
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});