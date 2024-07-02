export interface ClusterManagerState {
  clusterStarted: boolean;
  clusterShutdown: boolean;
  nodes: Map<string, string | null>;
  maxAssignedNodes: number;
}

export interface ClusterManagerInput {
  state?: ClusterManagerState;
}

export interface ClusterManagerStateSummary {
  maxAssignedNodes: number;
  assignedNodes: number;
  badNodes: number;
}

export interface AssignNodesToJobUpdateInput {
  numNodes: number;
  jobName: string;
}

export interface DeleteJobUpdateInput {
  jobName: string;
}

export interface ClusterManagerWorkflowResult {
  maxAssignedNodes: number;
  numCurrentlyAssignedNodes: number;
  numBadNodes: number;
}
