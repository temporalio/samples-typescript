import { Connection, Client, WorkflowHandle } from '@temporalio/client';
import { v4 as uuid } from 'uuid';

import { clusterManagerWorkflow } from './workflows';

export async function startClusterManager(): Promise<WorkflowHandle<typeof clusterManagerWorkflow>> {
  const connection = await Connection.connect({ address: 'localhost:7233' });
  const client = new Client({ connection });
  return client.workflow.start(clusterManagerWorkflow, {
    args: [{}],
    taskQueue: 'safe-message-handlers-task-queue',
    workflowId: `cm-${uuid().slice(0, 8)}`,
  });
}
