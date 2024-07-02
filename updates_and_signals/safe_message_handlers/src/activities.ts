import { proxyActivities } from '@temporalio/workflow';
import { ActivityInput as AllocateNodesToJobInput } from './interfaces';

// Activities with TypeScript syntax and Temporal TypeScript SDK specifics
const { allocateNodesToJob, deallocateNodesForJob, findBadNodes } = proxyActivities<{
  allocateNodesToJob(input: AllocateNodesToJobInput): Promise<void>;
  deallocateNodesForJob(input: DeallocateNodesForJobInput): Promise<void>;
  findBadNodes(input: FindBadNodesInput): Promise<string[]>;
}>({
  startToCloseTimeout: '1 minute',
});

export async function allocateNodesToJob(input: AllocateNodesToJobInput): Promise<void> {
  console.log(`Assigning nodes ${input.nodes} to job ${input.jobName}`);
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async operation
}

export async function deallocateNodesForJob(input: DeallocateNodesForJobInput): Promise<void> {
  console.log(`Deallocating nodes ${input.nodes} from job ${input.jobName}`);
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async operation
}

export async function findBadNodes(input: FindBadNodesInput): Promise<string[]> {
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async operation
  const badNodes = input.nodesToCheck.filter(n => parseInt(n) % 5 === 0);
  if (badNodes.length) {
    console.log(`Found bad nodes: ${badNodes}`);
  } else {
    console.log("No new bad nodes found.");
  }
  return badNodes;
}

