import { Connection, Client, WorkflowHandle } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
import { nanoid } from 'nanoid';

import { clusterManagerWorkflow } from './workflows';

export async function startClusterManager(): Promise<WorkflowHandle<typeof clusterManagerWorkflow>> {
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });
  return client.workflow.start(clusterManagerWorkflow, {
    taskQueue: 'safe-message-handlers-task-queue',
    workflowId: `cm-${nanoid()}`,
    args: [{ testContinueAsNew: false }],
  });
}
