import * as wf from '@temporalio/workflow';
import * as _3rdPartyAsyncMutexLibrary from 'async-mutex';
import { ClusterManager } from './cluster-manager';
import {
  AssignNodesToJobUpdateInput,
  ClusterManagerInput,
  ClusterManagerStateSummary,
  DeleteJobUpdateInput,
} from './types';

export const startClusterSignal = wf.defineSignal('startCluster');
export const shutdownClusterSignal = wf.defineSignal('shutdownCluster');
export const assignNodesToJobUpdate = wf.defineUpdate<ClusterManagerStateSummary, [AssignNodesToJobUpdateInput]>(
  'allocateNodesToJob'
);
export const deleteJobUpdate = wf.defineUpdate<void, [DeleteJobUpdateInput]>('deleteJob');
export const getClusterStatusQuery = wf.defineQuery<ClusterManagerStateSummary>('getClusterStatus');

export async function clusterManagerWorkflow(input: ClusterManagerInput): Promise<ClusterManagerStateSummary> {
  const manager = new ClusterManager(input.state);
  //
  // Message-handling API
  //
  // We do not use `bind()` since it loses the function type information.
  wf.setHandler(startClusterSignal, (...args) => manager.startCluster(...args));
  wf.setHandler(shutdownClusterSignal, (...args) => manager.shutDownCluster(...args));

  // This is an update as opposed to a signal because the client may want to wait for nodes to be
  // allocated before sending work to those nodes. Returns the array of node names that were
  // allocated to the job.
  wf.setHandler(assignNodesToJobUpdate, (...args) => manager.assignNodesToJob(...args), {
    validator: async (input: AssignNodesToJobUpdateInput): Promise<void> => {
      if (input.numNodes <= 0) {
        throw new Error(`numNodes must be positive (got ${input.numNodes})`);
      }
    },
  });

  // Even though it returns nothing, this is an update because the client may want to track it, for
  // example to wait for nodes to be unassigned before reassigning them.
  wf.setHandler(deleteJobUpdate, (...args) => manager.deleteJob(...args));
  wf.setHandler(getClusterStatusQuery, (...args) => manager.getStateSummary(...args));

  //
  // Main workflow logic
  //
  // The cluster manager workflow is a long-running workflow ("entity" workflow). Most of its logic
  // lies in the message-processing handlers implented in the ClusterManager class. The main
  // workflow itself is a loop that does the following:
  // - process messages
  // - perform health check at regular intervals
  // - continue-as-new when suggested
  //
  const healthCheckIntervalSeconds = 10;

  await wf.condition(() => manager.state.clusterStarted);
  for (;;) {
    await manager.performHealthChecks();
    await wf.condition(
      () => manager.state.clusterShutdown || wf.workflowInfo().continueAsNewSuggested,
      healthCheckIntervalSeconds * 1000
    );
    if (manager.state.clusterShutdown) {
      break;
    }
    if (wf.workflowInfo().continueAsNewSuggested) {
      await wf.continueAsNew<typeof clusterManagerWorkflow>({ state: manager.getState() });
    }
  }
  return manager.getStateSummary();
}
