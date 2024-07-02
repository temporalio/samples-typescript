import { WorkflowClient } from '@temporalio/client';
import { ClusterManagerWorkflow } from './workflow';
import { doClusterLifecycle } from './utils';

async function main() {
  const client = new WorkflowClient();

  // Define the workflow handle
  const workflow = client.createWorkflowHandle(ClusterManagerWorkflow, {
    workflowId: 'cluster-management-workflow',
  });

  // Start the cluster lifecycle
  await doClusterLifecycle(workflow);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
