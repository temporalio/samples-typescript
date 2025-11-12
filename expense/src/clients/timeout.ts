import { Client, Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { expense } from '../workflows';

async function run() {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

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
