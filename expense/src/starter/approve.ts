import { Connection, WorkflowClient } from '@temporalio/client';
import { expense } from '../workflows';
import { v4 } from 'uuid';

async function run() {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);
  const workflow = client.createWorkflowHandle(expense, { taskQueue: 'tutorial' });

  const expenseId = v4();

  await workflow.start(expenseId);

  await new Promise((resolve) => setTimeout(resolve, 50));
  await workflow.signal.approve();

  console.log('Done:', await workflow.result()); // Done: { status: 'COMPLETED' }
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});
