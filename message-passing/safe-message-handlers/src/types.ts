export interface ClusterManagerState {
  clusterState: ClusterState;
  nodes: Map<string, string | null>;
  maxAssignedNodes: number;
}

export interface ClusterManagerInput {
  state?: ClusterManagerState;
}

export interface ClusterManagerStateSummary {
  maxAssignedNodes: number;
  assignedNodes: number;
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

export enum ClusterState {
  NOT_STARTED = 'NOT_STARTED',
  STARTED = 'STARTED',
  SHUTTING_DOWN = 'SHUTTING_DOWN',
}
