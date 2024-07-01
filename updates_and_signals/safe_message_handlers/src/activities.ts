export interface AllocateNodesToJobInput {
  nodes: string[];
  jobName: string;
}

export interface DeallocateNodesForJobInput {
  nodes: string[];
  jobName: string;
}

export interface FindBadNodesInput {
  nodesToCheck: string[];
}

export async function allocateNodesToJob(input: AllocateNodesToJobInput): Promise<void> {
  console.log(`Assigning nodes ${input.nodes} to job ${input.jobName}`);
  await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async operation
}

export async function deallocateNodesForJob(input: DeallocateNodesForJobInput): Promise<void> {
  console.log(`Deallocating nodes ${input.nodes} from job ${input.jobName}`);
  await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async operation
}

export async function findBadNodes(input: FindBadNodesInput): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async operation
  const badNodes = input.nodesToCheck.filter((n) => parseInt(n) % 5 === 0);
  if (badNodes.length) {
    console.log(`Found bad nodes: ${badNodes}`);
  } else {
    console.log('No new bad nodes found.');
  }
  return badNodes;
}
