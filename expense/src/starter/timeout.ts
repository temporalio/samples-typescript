import { Connection, WorkflowClient } from '@temporalio/client';
import { expense } from '../workflows';
import { v4 } from 'uuid';

async function run() {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);
  const workflow = client.createWorkflowHandle(expense, { taskQueue: 'tutorial' });

  const expenseId = v4();

  // Prints "Done: { status: 'TIMED_OUT' }" after approximately 1 second
  console.log('Done:', await workflow.execute(expenseId, 1000));
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});
