import * as wf from '@temporalio/workflow';
import type * as activities from './activities';
import { Mutex } from 'async-mutex';
import {
  AssignNodesToJobUpdateInput,
  ClusterManagerState,
  ClusterManagerStateSummary,
  DeleteJobUpdateInput,
} from './types';

const { assignNodesToJob, unassignNodesForJob, startCluster } = wf.proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute', // TODO
});

// ClusterManagerWorkflow keeps track of the job assignments of a cluster of nodes. It exposes an
// API to started and shutdown the cluster, to assign jobs to nodes, to delete jobs, and to query
// cluster status. The workflow maps this API to Signals, Updates, and Queries. The assign and
// delete operations issue an RPC changing the state of the remote cluster, and then mutate workflow
// state reflecting the change made. In order that workflow state remains in sync with the true
// cluster state, assign/delete operations must not be performed concurrently (i.e. they must not
// "interleave" with each other; they must be "serialized"; they must be "atomic"). An async mutex
// from a 3rd party library is used to ensure this.
export class ClusterManager {
  state: ClusterManagerState;
  jobsWithNodesAssigned: Set<string>;
  nodesMutex: Mutex;

  constructor(state?: ClusterManagerState) {
    this.state = state ?? {
      clusterStarted: false,
      clusterShutdown: false,
      nodes: new Map<string, string | null>(),
      maxAssignedNodes: 0,
    };
    this.jobsWithNodesAssigned = new Set<string>();
    this.nodesMutex = new Mutex();
  }

  async startCluster(): Promise<void> {
    await startCluster();
    this.state.clusterStarted = true;
    for (let i = 0; i < 25; i++) {
      this.state.nodes.set(i.toString(), null);
    }
    wf.log.info('Cluster started');
  }

  async shutDownCluster(): Promise<void> {
    await wf.condition(() => this.state.clusterStarted);
    this.state.clusterShutdown = true;
    wf.log.info('Cluster shutdown');
  }

  async assignNodesToJob(input: AssignNodesToJobUpdateInput): Promise<ClusterManagerStateSummary> {
    await wf.condition(() => this.state.clusterStarted);
    if (this.state.clusterShutdown) {
      // If you want the client to receive a failure, either add an update validator and throw the
      // exception from there, or raise an ApplicationError. Other exceptions in the handler will
      // cause the workflow to keep retrying and get it stuck.
      throw new wf.ApplicationFailure('Cannot assign nodes to a job: Cluster is already shut down');
    }
    return await this.nodesMutex.runExclusive(async (): Promise<ClusterManagerStateSummary> => {
      // Idempotency guard: do nothing if the job already has nodes assigned.
      if (!new Set(this.state.nodes.values()).has(input.jobName)) {
        const unassignedNodes = this.getUnassignedNodes();
        if (input.numNodes > unassignedNodes.size) {
          throw new wf.ApplicationFailure(
            `Cannot assign ${input.numNodes} nodes; have only ${unassignedNodes.size} available`
          );
        }
        const nodesToAssign = Array.from(unassignedNodes).slice(0, input.numNodes);
        // This await would be dangerous without the lock held because it would allow interleaving
        // with the deleteJob operation, which mutates self.state.nodes.
        await assignNodesToJob({ nodes: nodesToAssign, jobName: input.jobName });
        for (const node of nodesToAssign) {
          this.state.nodes.set(node, input.jobName);
        }
        this.state.maxAssignedNodes = Math.max(this.state.maxAssignedNodes, this.getAssignedNodes().size);
      }
      return this.getStateSummary();
    });
  }

  async deleteJob(input: DeleteJobUpdateInput) {
    await wf.condition(() => this.state.clusterStarted);
    if (this.state.clusterShutdown) {
      // If you want the client to receive a failure, either add an update validator and throw the
      // exception from there, or raise an ApplicationError. Other exceptions in the handler will
      // cause the workflow to keep retrying and get it stuck.
      throw new wf.ApplicationFailure('Cannot delete job: Cluster is already shut down');
    }
    await this.nodesMutex.runExclusive(async () => {
      const nodesToUnassign = Array.from(this.state.nodes.entries())
        .filter(([_, v]) => v === input.jobName)
        .map(([k, _]) => k);
      // This await would be dangerous without the lock held because it would allow interleaving
      // with the assignNodesToJob and performHealthCheck operations, both of which mutate
      // self.state.nodes.
      await unassignNodesForJob({ nodes: nodesToUnassign, jobName: input.jobName });
      for (const node of nodesToUnassign) {
        this.state.nodes.set(node, null);
      }
    });
  }

  getState(): ClusterManagerState {
    return {
      clusterStarted: this.state.clusterStarted,
      clusterShutdown: this.state.clusterShutdown,
      nodes: this.state.nodes,
      maxAssignedNodes: this.state.maxAssignedNodes,
    };
  }

  getStateSummary(): ClusterManagerStateSummary {
    return {
      maxAssignedNodes: this.state.maxAssignedNodes,
      assignedNodes: this.getAssignedNodes().size,
      badNodes: this.getBadNodes().size,
    };
  }

  getUnassignedNodes(): Set<string> {
    return new Set(Array.from(this.state.nodes.keys()).filter((key) => this.state.nodes.get(key) === null));
  }

  getBadNodes(): Set<string> {
    return new Set(Array.from(this.state.nodes.keys()).filter((key) => this.state.nodes.get(key) === 'BAD!'));
  }

  getAssignedNodes(jobName?: string): Set<string> {
    return new Set(
      Array.from(this.state.nodes.keys()).filter((key) => {
        const value = this.state.nodes.get(key);
        return jobName ? value === jobName : value !== null && value !== 'BAD!';
      })
    );
  }
}
