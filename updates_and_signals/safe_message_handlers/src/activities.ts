interface AssignNodesToJobInput {
  nodes: string[];
  jobName: string;
}

interface UnassignNodesForJobInput {
  nodes: string[];
  jobName: string;
}

interface FindBadNodesInput {
  nodesToCheck: string[];
}

export async function assignNodesToJob(input: AssignNodesToJobInput): Promise<void> {
  console.log(`Assigning nodes ${input.nodes} to job ${input.jobName}`);
  await sleep(100); // Simulate RPC
}

export async function unassignNodesForJob(input: UnassignNodesForJobInput): Promise<void> {
  console.log(`Unassigning nodes ${input.nodes} from job ${input.jobName}`);
  await sleep(100); // Simulate RPC
}

export async function findBadNodes(input: FindBadNodesInput): Promise<string[]> {
  console.log('Finding bad nodes');
  await sleep(100); // Simulate RPC
  const badNodes = input.nodesToCheck.filter((n) => parseInt(n) % 5 === 0);
  if (badNodes.length) {
    console.log(`Found bad nodes: ${badNodes}`);
  } else {
    console.log('No new bad nodes found.');
  }
  return badNodes;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
