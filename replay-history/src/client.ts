import { Connection, WorkflowClient } from '@temporalio/client';
import { calculator, getValueQuery, signals } from './workflows';

async function run() {
  const connection = new Connection({});

  const client = new WorkflowClient(connection.service, {});

  const handle = await client.start(calculator, {
    taskQueue: 'replay-history',
    workflowId: 'calc',
  });
  await handle.signal(signals.add, 2);
  await handle.signal(signals.mul, 3);
  await handle.signal(signals.sub, 6);
  await handle.signal(signals.inverseFraction);
  const value = await handle.query(getValueQuery);
  console.log(value);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
