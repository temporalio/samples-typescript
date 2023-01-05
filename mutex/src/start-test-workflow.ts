import { Connection, Client } from '@temporalio/client';
import { oneAtATimeWorkflow } from './workflows';
import { nanoid } from 'nanoid';

const lockWorkflowId = process.argv[2];
if (!lockWorkflowId) {
  throw new Error('Must set lockWorkflowId');
}

async function run() {
  const connection = await Connection.connect();

  const client = new Client({ connection });

  const workflowId = 'test-' + nanoid();

  console.log('Starting test workflow with id', workflowId, 'connecting to lock workflow', lockWorkflowId);
  const start = Date.now();
  await client.workflow.execute(oneAtATimeWorkflow, {
    taskQueue: 'mutex',
    workflowId,
    args: [lockWorkflowId, 5000, 7500],
  });
  console.log('Test workflow finished after', Date.now() - start, 'ms');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
