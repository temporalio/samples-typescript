import { randomUUID } from 'node:crypto';
import { Worker } from '@temporalio/worker';
import { WorkflowClient } from '@temporalio/client';
import * as workflows from './workflows';
import * as updateWithActivityResponse from './update-with-activity/client';
import * as updateWithProxyWorkflow from './update-with-workflow/client';

function getUpdateMethod(m: string | undefined): workflows.UpdateMethod {
  if (m === 'activityResponse') return m;
  if (m === 'proxyWorkflow') return m;
  throw new TypeError(`Invalid update method ${m}`);
}

async function main() {
  const taskQueue = 'updatable-workflow';
  // Worker with workflow to update
  const worker = await Worker.create({
    taskQueue,
    workflowsPath: require.resolve('./workflows'),
  });

  const updateMethod = getUpdateMethod(process.argv[2]);

  await worker.runUntil(async () => {
    const client = new WorkflowClient();
    const handle = await client.start(workflows.updatableWorkflow, {
      args: [updateMethod],
      workflowId: randomUUID(),
      taskQueue,
    });
    if (updateMethod === 'activityResponse') {
      const response = await updateWithActivityResponse.updateWorkflow(handle, 'Temporal');
      console.log({ response });
    } else if (updateMethod === 'proxyWorkflow') {
      const response = await updateWithProxyWorkflow.updateWorkflow(handle, 'Temporal', taskQueue);
      console.log({ response });
    }
    await handle.terminate(); // Avoid keeping around sample workflows
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
