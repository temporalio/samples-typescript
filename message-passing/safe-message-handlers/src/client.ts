import { Connection, Client, WorkflowHandle } from '@temporalio/client';
import { nanoid } from 'nanoid';

import { clusterManagerWorkflow } from './workflows';

export async function startClusterManager(): Promise<WorkflowHandle<typeof clusterManagerWorkflow>> {
  const connection = await Connection.connect({ address: 'localhost:7233' });
  const client = new Client({ connection });
  return client.workflow.start(clusterManagerWorkflow, {
    taskQueue: 'safe-message-handlers-task-queue',
    workflowId: `cm-${nanoid()}`,
    args: [{ testContinueAsNew: false }],
  });
}
