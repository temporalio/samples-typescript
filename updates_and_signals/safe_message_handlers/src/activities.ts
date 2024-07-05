interface AssignNodesToJobInput {
  nodes: string[];
  jobName: string;
}

interface UnassignNodesForJobInput {
  nodes: string[];
  jobName: string;
}

export async function startCluster(): Promise<void> {
  console.log('Starting cluster');
  await sleep(100); // Simulate RPC
}

export async function assignNodesToJob(input: AssignNodesToJobInput): Promise<void> {
  console.log(`Assigning nodes ${input.nodes} to job ${input.jobName}`);
  await sleep(100); // Simulate RPC
}

export async function unassignNodesForJob(input: UnassignNodesForJobInput): Promise<void> {
  console.log(`Unassigning nodes ${input.nodes} from job ${input.jobName}`);
  await sleep(100); // Simulate RPC
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
