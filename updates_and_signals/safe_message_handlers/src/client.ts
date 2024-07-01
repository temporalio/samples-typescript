import { Connection, Client, WorkflowHandle } from '@temporalio/client';
import * as workflow from './workflows';

async function doClusterLifecycle(wf: WorkflowHandle, delaySeconds?: number): Promise<void> {
  await wf.signal(workflow.startClusterSignal);

  const allocationUpdates: Promise<any>[] = [];
  for (let i = 0; i < 6; i++) {
    allocationUpdates.push(
      wf.executeUpdate(workflow.allocateNodesToJobUpdate, { args: [{ numNodes: 2, jobName: `task-${i}` }] })
    );
  }
  await Promise.all(allocationUpdates);

  if (delaySeconds) {
    await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));
  }

  const deletionUpdates: Promise<any>[] = [];
  for (let i = 0; i < 6; i++) {
    deletionUpdates.push(wf.executeUpdate(workflow.deleteJobUpdate, { args: [{ jobName: `task-${i}` }] }));
  }
  await Promise.all(deletionUpdates);

  await wf.signal(workflow.shutdownClusterSignal);
}
async function main() {
  const connection = await Connection.connect({ address: 'localhost:7233' });
  const client = new Client({ connection });

  // Define the workflow handle
  const wfHandle = await client.workflow.start(workflow.clusterManagerWorkflow, {
    args: [{ testContinueAsNew: true }],
    taskQueue: 'tq',
    workflowId: 'cluster-management-workflow',
  });

  // Start the cluster lifecycle
  await doClusterLifecycle(wfHandle);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
