// This file contains the TypeScript port of the Python workflow for managing cluster updates and signals

import { proxyActivities, defineSignal, defineQuery, setHandler, condition, sleep, defineWorkflow } from '@temporalio/workflow';
import type { AllocateNodesToJobInput, DeallocateNodesForJobInput, FindBadNodesInput } from './interfaces';

// Define signals
const startClusterSignal = defineSignal('startCluster');
const shutdownClusterSignal = defineSignal('shutdownCluster');
const allocateNodesToJobSignal = defineSignal<[AllocateNodesToJobInput]>('allocateNodesToJob');
const deallocateNodesForJobSignal = defineSignal<[DeallocateNodesForJobInput]>('deallocateNodesForJob');

// Define queries
const getClusterStatusQuery = defineQuery<{}>('getClusterStatus');

// Define activities
const { allocateNodesToJob, deallocateNodesForJob, findBadNodes } = proxyActivities<{
  allocateNodesToJob(input: AllocateNodesToJobInput): Promise<void>;
  deallocateNodesForJob(input: DeallocateNodesForJobInput): Promise<void>;
  findBadNodes(input: FindBadNodesInput): Promise<string[]>;
}>({
  startToCloseTimeout: '1 minute',
});

// Define workflow interface
export interface ClusterManagerWorkflow {
  run(input: ClusterManagerWorkflowInput): Promise<ClusterManagerWorkflowResult>;
}

// Define workflow input and result types
export interface ClusterManagerWorkflowInput {
  testContinueAsNew: boolean;
}

export interface ClusterManagerWorkflowResult {
  maxAssignedNodes: number;
  numCurrentlyAssignedNodes: number;
  numBadNodes: number;
}

// Workflow implementation
export const clusterManagerWorkflow: ClusterManagerWorkflow = defineWorkflow({
  async run(input: ClusterManagerWorkflowInput) {
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

    setHandler(allocateNodesToJobSignal, async (input: AllocateNodesToJobInput) => {
      if (!state.clusterStarted || state.clusterShutdown) {
        throw new Error('Cluster is not in a valid state for node allocation');
      }
      // Allocate nodes to job logic
    });

    setHandler(deallocateNodesForJobSignal, async (input: DeallocateNodesForJobInput) => {
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
        numAssignedNodes: Object.values(state.nodes).filter(n => n !== null).length,
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
      numCurrentlyAssignedNodes: Object.values(state.nodes).filter(n => n !== null).length,
      numBadNodes: Object.values(state.nodes).filter(n => n === 'BAD').length,
    };
  },
});
