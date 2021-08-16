'use strict';

const { Connection, WorkflowClient } = require('@temporalio/client');
const uuid = require('uuid');

async function run() {
  const connection = new Connection();
  const client = new WorkflowClient(connection.service);
  const expense = client.stub('expense', { taskQueue: 'tutorial_expense1' });

  const expenseId = uuid.v4();

  await expense.start(expenseId);

  await new Promise(resolve => setTimeout(resolve, 50));
  await expense.signal.approve();

  console.log('Done:', await expense.result()); // Done: { status: 'COMPLETED' }
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});