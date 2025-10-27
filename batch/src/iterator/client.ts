import { Connection, Client } from '@temporalio/client';
import { processBatch } from './workflows';

async function run() {
  const connection = await Connection.connect();
  const client = new Client({ connection });

  const handle = await client.workflow.start(processBatch, {
    taskQueue: 'tq-iterator-wf',
    workflowId: 'iterator-wf',
    args: [
      {
        pageSize: 5,
        offset: 0,
      },
    ],
  });
  const result = await handle.result();
  console.log('Execution result:', result);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
