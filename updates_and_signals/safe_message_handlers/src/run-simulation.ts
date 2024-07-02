import { WorkflowHandle } from '@temporalio/client';

import { assignNodesToJobUpdate, startClusterSignal, deleteJobUpdate, shutdownClusterSignal } from './workflows';
import { startClusterManager } from './client';

async function runSimulation(wf: WorkflowHandle, delaySeconds?: number): Promise<void> {
  await wf.signal(startClusterSignal);

  const allocationUpdates: Promise<any>[] = [];
  for (let i = 0; i < 6; i++) {
    allocationUpdates.push(wf.executeUpdate(assignNodesToJobUpdate, { args: [{ numNodes: 2, jobName: `task-${i}` }] }));
  }
  await Promise.all(allocationUpdates);

  if (delaySeconds) {
    await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));
  }

  const deletionUpdates: Promise<any>[] = [];
  for (let i = 0; i < 6; i++) {
    deletionUpdates.push(wf.executeUpdate(deleteJobUpdate, { args: [{ jobName: `task-${i}` }] }));
  }
  await Promise.all(deletionUpdates);

  await wf.signal(shutdownClusterSignal);
}

async function main() {
  const workflow = await startClusterManager();
  await runSimulation(workflow);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
