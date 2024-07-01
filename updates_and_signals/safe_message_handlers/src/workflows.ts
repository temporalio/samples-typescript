// This file contains the TypeScript port of the Python workflow for managing cluster updates and signals

import {
  proxyActivities,
  defineSignal,
  defineUpdate,
  defineQuery,
  setHandler,
  condition,
  sleep,
} from '@temporalio/workflow';
import type * as activities from './activities';

interface ClusterManagerState {
  clusterStarted: boolean;
  clusterShutdown: boolean;
  nodes: { [key: string]: string | null };
  jobsAdded: Set<string>;
  maxAssignedNodes: number;
}

interface ClusterManagerInput {
  state?: ClusterManagerState;
  testContinueAsNew: boolean;
}

interface ClusterManagerResult {
  maxAssignedNodes: number;
  numCurrentlyAssignedNodes: number;
  numBadNodes: number;
}

export interface AllocateNodesToJobInput {
  numNodes: number;
  jobName: string;
}

interface DeleteJobInput {
  jobName: string;
}

export interface ClusterManagerWorkflowInput {
  testContinueAsNew: boolean;
}

export interface ClusterManagerWorkflowResult {
  maxAssignedNodes: number;
  numCurrentlyAssignedNodes: number;
  numBadNodes: number;
}

// Message-handling API
export const startClusterSignal = defineSignal('startCluster');
export const shutdownClusterSignal = defineSignal('shutdownCluster');
export const allocateNodesToJobUpdate = defineUpdate<string[], [AllocateNodesToJobInput]>('allocateNodesToJob');
export const deleteJobUpdate = defineUpdate<void, [DeleteJobInput]>('deleteJob');
const getClusterStatusQuery = defineQuery<{}>('getClusterStatus');

// Activities
const { allocateNodesToJob, deallocateNodesForJob, findBadNodes } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export async function clusterManagerWorkflow(input: ClusterManagerWorkflowInput) {
  let state = {
    clusterStarted: false,
    clusterShutdown: false,
    nodes: {} as Record<string, string | null>,
    jobsAdded: new Set<string>(),
    maxAssignedNodes: 0,
  };

  // Signal handlers
  setHandler(startClusterSignal, () => {
    state.clusterStarted = true;
    for (let i = 0; i < 25; i++) {
      state.nodes[i.toString()] = null;
    }
  });

  setHandler(shutdownClusterSignal, () => {
    state.clusterShutdown = true;
  });

  setHandler(allocateNodesToJobUpdate, async (input: AllocateNodesToJobInput): Promise<string[]> => {
    if (!state.clusterStarted || state.clusterShutdown) {
      throw new Error('Cluster is not in a valid state for node allocation');
    }
    // Allocate nodes to job logic
    return [];
  });

  setHandler(deleteJobUpdate, async (input: DeleteJobInput) => {
    if (!state.clusterStarted || state.clusterShutdown) {
      throw new Error('Cluster is not in a valid state for node deallocation');
    }
    // Deallocate nodes from job logic
  });

  // Query handler
  setHandler(getClusterStatusQuery, () => {
    return {
      clusterStarted: state.clusterStarted,
      clusterShutdown: state.clusterShutdown,
      numNodes: Object.keys(state.nodes).length,
      numAssignedNodes: Object.values(state.nodes).filter((n) => n !== null).length,
    };
  });

  // Main workflow logic
  await condition(() => state.clusterStarted, 'Waiting for cluster to start');
  // Perform operations while cluster is active
  while (!state.clusterShutdown) {
    // Example: perform periodic health checks
    await sleep(60000); // Sleep for 60 seconds
  }

  // Return workflow result
  return {
    maxAssignedNodes: state.maxAssignedNodes,
    numCurrentlyAssignedNodes: Object.values(state.nodes).filter((n) => n !== null).length,
    numBadNodes: Object.values(state.nodes).filter((n) => n === 'BAD').length,
  };
}
