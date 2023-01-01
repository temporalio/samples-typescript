import { Connection, Client } from '@temporalio/client';
import { lockWorkflow } from './workflows';
import { v4 as uuidv4 } from 'uuid';

async function run() {
  const connection = await Connection.connect();

  const client = new Client({ connection });

  const workflowId = 'lock-' + uuidv4();
  await client.workflow.start(lockWorkflow, {
    taskQueue: 'mutex',
    workflowId,
  });
  console.log('Started lock workflow with id', workflowId);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
