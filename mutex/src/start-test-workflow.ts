import { Connection, Client, WorkflowExecutionAlreadyStartedError } from '@temporalio/client';
import { lockWorkflow, oneAtATimeWorkflow } from './workflows';
import { nanoid } from 'nanoid';

const resourceId = process.argv[2];
if (!resourceId) {
  throw new Error('Must set resourceId');
}

async function run() {
  const connection = await Connection.connect();

  const client = new Client({ connection });

  const workflowId = 'test-' + nanoid();

  try {
    await client.workflow.start(lockWorkflow, {
      taskQueue: 'mutex',
      workflowId: resourceId,
    });

    console.log('Started new lock Workflow for resourceId', resourceId);
  } catch (err) {
    if (err instanceof WorkflowExecutionAlreadyStartedError) {
      console.log('Reusing existing lock Workflow for resourceId', resourceId);
    } else {
      throw err;
    }
  }

  console.log('Starting test workflow with id', workflowId, 'connecting to lock workflow', resourceId);
  const start = Date.now();
  await client.workflow.execute(oneAtATimeWorkflow, {
    taskQueue: 'mutex',
    workflowId,
    args: [resourceId, 5000, 7500],
  });
  console.log('Test workflow finished after', Date.now() - start, 'ms');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
