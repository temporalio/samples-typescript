import * as activities from '@temporalio/activity';

interface AssignNodesToJobInput {
  nodes: string[];
  jobName: string;
}

interface UnassignNodesForJobInput {
  nodes: string[];
  jobName: string;
}

export async function startCluster(): Promise<void> {
  activities.log.info('Starting cluster');
  await activities.sleep(100); // Simulate RPC
}

export async function shutdownCluster(): Promise<void> {
  activities.log.info('Shutting down cluster');
  await activities.sleep(100); // Simulate RPC
}

export async function assignNodesToJob(input: AssignNodesToJobInput): Promise<void> {
  activities.log.info(`Assigning nodes ${input.nodes} to job ${input.jobName}`);
  await activities.sleep(100); // Simulate RPC
}

export async function unassignNodesForJob(input: UnassignNodesForJobInput): Promise<void> {
  activities.log.info(`Unassigning nodes ${input.nodes} from job ${input.jobName}`);
  await activities.sleep(100); // Simulate RPC
}
