import { WorkflowClient } from '@temporalio/client';
import { ClusterManagerWorkflow } from './workflow';
import { v4 as uuidv4 } from 'uuid';

async function run() {
  const client = new WorkflowClient();

  // Define the workflow handle
  const workflow = client.createWorkflowHandle(ClusterManagerWorkflow, {
    workflowId: `cluster-management-workflow-${uuidv4()}`,
  });

  // Test workflow functionality
  await workflow.start();
  await workflow.signal.startCluster();
  await workflow.executeUpdate('allocateNodesToJob', {
    numNodes: 5,
    jobName: 'job1',
  });
  await workflow.signal.shutdownCluster();
  const result = await workflow.result();
  console.log('Workflow result:', result);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
