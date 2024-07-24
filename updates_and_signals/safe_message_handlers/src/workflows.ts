import * as wf from '@temporalio/workflow';
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
  wf.setHandler(startClusterSignal, () => manager.startCluster());
  wf.setHandler(shutdownClusterSignal, () => manager.shutDownCluster());

  // This is an update as opposed to a signal because the client may want to wait for nodes to be
  // allocated before sending work to those nodes. Returns the array of node names that were
  // allocated to the job.
  wf.setHandler(assignNodesToJobUpdate, (input) => manager.assignNodesToJob(input), {
    validator: async (input: AssignNodesToJobUpdateInput): Promise<void> => {
      if (input.numNodes <= 0) {
        throw new Error(`numNodes must be positive (got ${input.numNodes})`);
      }
    },
  });

  // Even though it returns nothing, this is an update because the client may want to track it, for
  // example to wait for nodes to be unassigned before reassigning them.
  wf.setHandler(deleteJobUpdate, (input) => manager.deleteJob(input));
  wf.setHandler(getClusterStatusQuery, () => manager.getStateSummary());

  //
  // Main workflow logic
  //
  // The cluster manager workflow is a long-running workflow ("entity" workflow). Most of its logic
  // lies in the message-processing handlers implented in the ClusterManager class. The main
  // workflow itself simply waits until the cluster is shutdown, or the workflow needs to
  // continue-as-new.
  await wf.condition(() => manager.state.clusterShutdown || wf.workflowInfo().continueAsNewSuggested);
  if (wf.workflowInfo().continueAsNewSuggested) {
    await wf.continueAsNew<typeof clusterManagerWorkflow>({ state: manager.getState() });
    return undefined as never;
  } else {
    return manager.getStateSummary();
  }
}
