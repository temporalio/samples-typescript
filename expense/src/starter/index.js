'use strict';

const { Connection } = require('@temporalio/client');
const uuid = require('uuid');

async function run() {
  const connection = new Connection();
  const expense = connection.workflow('expense', { taskQueue: 'tutorial_expense1' });

  const expenseId = uuid.v4();

  const promise = expense.start(expenseId);

  await expense.started;

  await new Promise(resolve => setTimeout(resolve, 50));
  await expense.signal.approve();

  console.log('Done:', await promise); // Done: { status: 'COMPLETED' }
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});